import * as assert from 'assert';
import * as vsc from 'vscode';
import { AutoCorrect } from '../../extension';
//import * as perms from './perms.json';

suite('Extension Test Suite', () => {
	vsc.window.showInformationMessage('Start all tests.');
	const ac = new AutoCorrect();

	ac.cfg.ensureCfgLoaded(true);

	test('Test Triggering', () => {
		[' ', '.', ',', ':', '\'', '"'].forEach(ch => {
			assert.ok(
				ac.shouldAutoCorrect(ch),
				`"${ch}" should trigger auto-complete`
			);
		});

		['a', '1', 'W', '_', 'd'].forEach(ch => {
			assert. ok(
				!ac.shouldAutoCorrect(ch),
				`"${ch}" should NOT trigger auto-complete`
			);
		});
	});

	test('Test Corrections', () =>
	{
		const LANG = 'markdown';
	
		[
			["Who", "WHo"],
			["will", "wlil", "wil"],
			["the", "teh", "te", "hte", "th"],
		].forEach((words, index) => {
			const word = words[0];
			words.slice(1).forEach(mspll => {
				//const repls = ac.cfg.getReplacersForDocumentType(LANG);
				const repl = ac.getReplacementText(mspll, LANG);
				assert.strictEqual(
					repl, word,
					`"${repl}" should correct to "${word}" (${index}/"${mspll}")`
				);
			});
		});

		[
			"reign",
		].forEach((word, index) => {
			const repl = ac.getReplacementText(word, LANG);
			assert.strictEqual(
				repl, undefined,
				`"${repl}" should NOT be corrected (${index}/"${word}")`
			);
		});
	});
});
