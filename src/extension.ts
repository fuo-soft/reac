import * as vsc from 'vscode';
import Cfg, { Replacer } from './cfg';


function getCase(text: string)
{
	if (text.match(/[A-Z][^A-Z]+/)) {
		return 't';
	}
	else if (text.match(/[^a-z]+/)) {
		return 'u';
	}
	else if (text.match(/[^A-Z]+/)) {
		return 'l';
	}
}

function transformText(text: string, original: string, how?: string)
{
	switch (how) {
	case 't':
		return text[0].toLocaleUpperCase() + text.slice(1).toLocaleLowerCase();

	case 'u':
		return text.toLocaleUpperCase();

	case 'l':
		return text.toLocaleLowerCase();

	case 'p':
		return transformText(text, original, getCase(original));
	}

	return text;
}

class AutoCorrect
{
	readonly cfg: Cfg;

	constructor(private context: vsc.ExtensionContext)
	{
		this.cfg = new Cfg();

		context.subscriptions.push(
			vsc.commands.registerCommand('reac.reloadCfg', () => {
				this.cfg.ensureCfgLoaded(true);
			})
		);

		vsc.workspace.onDidChangeTextDocument(evt => this.onDidChangeTextDocument(evt));
	}

	onDidChangeTextDocument(evt: vsc.TextDocumentChangeEvent)
	{
		const editor = vsc.window.activeTextEditor;

		if (!this.cfg.ensureCfgLoaded(false)) {
			console.warn('no cfg');
			return;
		}
		
		if (editor && editor.document === evt.document &&
			evt.contentChanges.length && evt.contentChanges[0].text.match(this.cfg.triggerPattern))
		{
			const { selection } = editor;
			const { start } = selection;
			const lineStart = new vsc.Position(selection.start.line, 0);
			const line = new vsc.Range(lineStart, start);
			const text = editor.document.getText(line);
			const last = text.match(this.cfg.wordPattern);

			if (last)
			{
				const repls = this.cfg.getReplacersForDocumentType(editor.document.languageId);

				if (repls)
				{
					const nt = this.findReplacementText(last[0], repls);

					if (nt) {
						editor.edit(e => {
							const wordStart = lineStart.translate(0, last.index);
							const rng = new vsc.Range(wordStart, wordStart.translate(0, last[0].length));

							e.replace(rng, nt);
						});
					}
				}
			}
		}
	}

	findReplacementText(text: string, repls: Replacer[])
	{
		for (const repl of repls)
		{
			const m = text.match(repl.regex);

			if (m) {
				const nt = text.replace(repl.regex, repl.repl);
				const res = transformText(nt, text, repl.transform);

				console.log('REPLACING "%O" with "%O" (%O)', text, res, repl);
				return res;
			}
		}

		return null;
	}
}

export function activate(context: vsc.ExtensionContext)
{
	console.log('STARTUP');
	new AutoCorrect(context);
}

export function deactivate() {
}
