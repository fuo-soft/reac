import * as vsc from 'vscode';
import getInternalRepls from './internal.js';

const NAME = 'reac';
const DEFAULT_TRIGGER_PATTERN = /\W/;
const DEFAULT_WORD_PATTERN = /\w+/;

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
	private _triggerPattern: RegExp = DEFAULT_TRIGGER_PATTERN;
	private _wordPattern: RegExp = DEFAULT_WORD_PATTERN;

	constructor()
	{
		vsc.workspace.onDidChangeConfiguration(evt => this.onDidChangeConfiguration(evt));
	}

	get triggerPattern() {
		return this._triggerPattern;
	}

	get wordPattern() {
		return this._wordPattern;
	}

	ensureCfgLoaded(force: boolean)
	{
		if ((!this.all || force) && vsc.window.activeTextEditor)
		{
			const cfg = vsc.workspace.getConfiguration(NAME, vsc.window.activeTextEditor.document.uri);
			const internal = <Repl[]>getInternalRepls();
			const external = cfg.get<Repl[]>('replacers') ?? [];
			const src = cfg.get('replacerSource', 'both');

			this.all = (src === 'both' || src === 'internal') ? internal : [];

			if (src === 'both' || src === 'external') {
				this.all = [...this.all, ...external];
			}
	
			this.languageMap.clear();

			this._triggerPattern = new RegExp(cfg.get('triggerPattern', DEFAULT_TRIGGER_PATTERN));
			this._wordPattern = new RegExp(cfg.get('wordPattern', DEFAULT_WORD_PATTERN));

			console.log('loaded cfg tp=%o wp=%o src=%o all=%o',
				this._triggerPattern, this._wordPattern, src, this.all);
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