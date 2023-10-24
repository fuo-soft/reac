import * as vsc from 'vscode';

const NAME = 'reac';

interface Repl {
	languages: string[];
	patterns: string[][];
};

class Replacer
{
	readonly pattern: string;
	readonly repl: string;
	readonly regex: RegExp;
	readonly transform?: string;
	readonly ignored?: string;

	constructor(args: string[])
	{
		if (args.length < 2) {
			throw Error('Invalid pattern' + args.toString());
		}

		const flags = args.length > 2 ? args[2] : '';
		const reflags = flags.match(/[ig]+/)?.[0];

		this.pattern = args[0];
		this.repl = args[1];
		this.transform = flags.match(/[tulp]/)?.[0];
		this.ignored = args.length > 3 ? args[3] : undefined;

		if (flags.includes('s')) {
			this.regex = new RegExp(this.pattern, reflags);
		}
		else {
			this.regex = new RegExp('^' + this.pattern + '$', reflags);
		}
	}
}

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
	private languageMap = new Map<string, Replacer[]>();
	private all?: Repl[];

	constructor(private context: vsc.ExtensionContext)
	{
		vsc.workspace.onDidChangeTextDocument(evt => this.onDidChangeTextDocument(evt));
		vsc.workspace.onDidChangeConfiguration(evt => this.onDidChangeConfiguration(evt));
	}

	ensureCfgLoaded(force: boolean)
	{
		if ((!this.all || force) && vsc.window.activeTextEditor)
		{
			const cfg = vsc.workspace.getConfiguration(NAME, vsc.window.activeTextEditor.document.uri);
			
			this.all = cfg.get<Repl[]>('replacers');
			this.languageMap.clear();
			
			console.log('loaded cfg %o', this.all);
		}

		return this.all;
	}

	onDidChangeConfiguration(evt: vsc.ConfigurationChangeEvent)
	{
		console.log('onDidChangeConfiguration %o %O', evt.affectsConfiguration(NAME), evt);
		this.ensureCfgLoaded(true);
	}

	getReplacersForDocumentType(languageId: string)
	{
		let repls = this.languageMap.get(languageId);
		
		if (this.all && !repls) {
			repls = this.all
				.filter(d => d["languages"].some(re => languageId.match(new RegExp(re))))
				.map(d => d["patterns"].map(p => new Replacer(p)))
				.flat();
			
				console.log('LANG %s: %O', languageId, repls);
				this.languageMap.set(languageId, repls);
		}

		return repls;
	}

	onDidChangeTextDocument(evt: vsc.TextDocumentChangeEvent)
	{
		const editor = vsc.window.activeTextEditor;

		if (editor && editor.document === evt.document &&
			evt.contentChanges.length && evt.contentChanges[0].text.match(/\W/))
		{
			const { selection } = editor;
			const { start } = selection;
			const lineStart = new vsc.Position(selection.start.line, 0);
			const line = new vsc.Range(lineStart, start);
			const text = editor.document.getText(line);
			const last = text.match(/\w+$/);

			if (!this.ensureCfgLoaded(false)) {
				console.warn('no cfg');
				return;
			}

			if (last)
			{
				const repls = this.getReplacersForDocumentType(editor.document.languageId);

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
