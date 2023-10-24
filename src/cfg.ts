import * as vsc from 'vscode';
import getInternalRepls from './internal.js';

const NAME = 'reac';

interface Repl {
	languages: string[];
	patterns: string[][];
};

export class Replacer
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

export default class Cfg
{
	private languageMap = new Map<string, Replacer[]>();
	private all?: Repl[];

	constructor()
	{
		vsc.workspace.onDidChangeConfiguration(evt => this.onDidChangeConfiguration(evt));
	}

	ensureCfgLoaded(force: boolean)
	{
		if ((!this.all || force) && vsc.window.activeTextEditor)
		{
			//const cfg = vsc.workspace.getConfiguration(NAME, vsc.window.activeTextEditor.document.uri);
			
			//this.all = cfg.get<Repl[]>('replacers');
			this.all = <Repl[]>getInternalRepls();
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
}