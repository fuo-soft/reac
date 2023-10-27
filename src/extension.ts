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
			//vsc.commands.registerCommand('reac.reloadCfg', () => {
			//	this.cfg.ensureCfgLoaded(true);
			//})
			vsc.commands.registerCommand('reac.performAutoCorrect', () => {
				this.performAutoCorrect();
			})
		);

		vsc.workspace.onDidChangeTextDocument(evt => this.onDidChangeTextDocument(evt));
	}

	getPreviousWordRange(editor: vsc.TextEditor, selection: vsc.Selection)
	{
		const lineStart = new vsc.Position(selection.start.line, 0);
		const line = new vsc.Range(lineStart, selection.start);
		const text = editor.document.getText(line);
		const m = text.match(this.cfg.wordPattern);

		if (m) {
			const wordStart = lineStart.translate(0, m.index);
			return new vsc.Range(wordStart, wordStart.translate(0, m[0].length));
		}
	}

	getReplacementText(editor: vsc.TextEditor, text: string)
	{
		const repls = this.cfg.getReplacersForDocumentType(editor.document.languageId);

		if (repls) {
			for (const repl of repls)
			{
				const m = text.match(repl.regex);

				if (m) {
					const nt = text.replace(repl.regex, repl.repl);
					const res = transformText(nt, text, repl.transform);

					console.log('FOUND REPLACEMENT FOR "%O" with "%O" (%O)', text, res, repl);
					return res;
				}
			}
		}
	}

	performReplacement(editor: vsc.TextEditor, rng: vsc.Range, repl: string)
	{
		editor.edit(e => {
			e.replace(rng, repl);
		});
	}

	performAutoCorrect()
	{
		const editor = vsc.window.activeTextEditor;

		if (!this.cfg.ensureCfgLoaded(false)) {
			console.warn('no cfg');
			return;
		}
		
		if (editor)
		{
			const { selection } = editor;
			const rng = (selection.active)
				? editor.selection
				: this.getPreviousWordRange(editor, selection);

			if (rng)
			{
				const text = editor.document.getText(rng);
				const repl = this.getReplacementText(editor, text);

				if (repl) {
					this.performReplacement(editor, rng, repl);
				}
			}
		}
	}

	onDidChangeTextDocument(evt: vsc.TextDocumentChangeEvent)
	{
		const editor = vsc.window.activeTextEditor;

		if (!this.cfg.ensureCfgLoaded(false)) {
			console.warn('no cfg');
			return;
		}
		
		if (editor &&
			editor.document === evt.document &&
			evt.contentChanges.length &&
			evt.contentChanges[0].text.match(this.cfg.triggerPattern))
		{
			const { selection } = editor;
			const rng = this.getPreviousWordRange(editor, selection);

			if (rng) {
				const repl = this.getReplacementText(editor, editor.document.getText(rng));

				if (repl) {
					this.performReplacement(editor, rng, repl);
				}
			}
		}
	}
}

export function activate(context: vsc.ExtensionContext)
{
	console.log('STARTUP');
	new AutoCorrect(context);
}

export function deactivate() {
}
