import postcss from 'postcss';
import { equal } from 'node:assert/strict';
import { describe, it, test } from 'node:test';
import type { OptionsType, OptionsPartialType } from '../src/types';
import { ignoreNextComment, getUnitRegexp, createUnitReplace } from '../src/utils';
import plugin from '../src/index';

const defaultOptions: Omit<OptionsType, 'exclude' | 'include' | 'minUnitValue' | 'unitWidthCssVar'> = {
	unitPrecision: 4,
	unitToConvert: 'px',
	convertToUnit: 'vw',
	viewportWidth: 1280,
	selectorBlackList: [],
};

const getReplacedUnit = (value: string, opts: OptionsPartialType = {}) => {
	const options = { ...defaultOptions, ...opts };
	const unitRegex = getUnitRegexp(options.unitToConvert);

	return value.replace(unitRegex, createUnitReplace(options));
};

const getWrapedOutputWithMedia = (input: string, output: string, opts: OptionsPartialType = {}) => {
	const options = { ...defaultOptions, ...opts };

	return `
		${input}
		@media (min-width: ${options.viewportWidth}${options.unitToConvert}) {
			${output}
		}
	`;
};

const run = async (input: string, output: string, opts: OptionsPartialType = {}, from?: string) => {
	const options = { ...defaultOptions, ...opts };
	// Used instead beautify css
	const regexReplaceSpaces = /[\n\t\r\s]/g;
	const result = await postcss([plugin(options)]).process(input, { from });
	equal(result.css.replace(regexReplaceSpaces, ''), output.replace(regexReplaceSpaces, ''));
	equal(result.warnings().length, 0);
};

test('length of float number vw should not bigger then unitPrecision after replace px with vw', () => {
	const val = '12px';
	const unitPrecision = 2;
	const repacedUnit = getReplacedUnit(val, {
		unitPrecision,
		viewportWidth: 1280,
	}); // repacedUnit will be 0.94vw with unitPrecision without 0.9375vw
	const unitPrecisionLength = repacedUnit.split('.')[1].length - 2; // -2 is unit vw;

	equal(repacedUnit, '0.94vw');
	equal(unitPrecisionLength, unitPrecision);
});

test('Not transform styles in exlude file', async () => {
	const val = '2px';
	const val2 = '3px';
	const repacedUnit = getReplacedUnit(val);
	const repacedUnit2 = getReplacedUnit(val2);
	const input = `.rule { margin: 0.5rem ${val} ${val2} -.2em; }`;
	const output = `.rule {margin: 0.5rem ${repacedUnit} ${repacedUnit2} -.2em;}`;
	const resultOutput = getWrapedOutputWithMedia(input, output);

	await run(input, input, { exclude: /node_modules/ }, 'node_modules/a.css');
	await run(input, input, { exclude: [/node_modules/, /b.css/] }, 'some-path/b.css');
	await run(input, resultOutput, { exclude: /node_modules/ }, 'valid-path/a.css');
});

test('should replace custom unit with replace unit', async () => {
	const val = '12rem';
	const options = {
		viewportWidth: 1280,
		unitToConvert: 'rem',
		convertToUnit: 'px',
	};
	const repacedUnit = getReplacedUnit(val, options); // repacedUnit will be 0.9375px
	const input = `.rule { margin: 0.5em ${val} 12px -.2em; }`;
	const output = `.rule {margin: 0.5em ${repacedUnit} 12px -.2em;}`;
	const resultOutput = getWrapedOutputWithMedia(input, output, options);

	equal(repacedUnit, '0.9375px');
	await run(input, resultOutput, options);
});

test('should not add properties that already exist', async () => {
	const val = '12px';
	const options = {
		viewportWidth: 1280,
	};
	const repacedUnit = getReplacedUnit(val, options); // repacedUnit will be 0.9375vw
	const input = `.rule { color: red; font-size: 0.9375vw; }`;
	const output = `${input}`;

	equal(repacedUnit, '0.9375vw');
	await run(input, output, options);
});

describe('Replace px to vw', () => {
	it('should replace the positive px unit with vw', async () => {
		const val = '5px';
		const val2 = '3px';
		const repacedUnit = getReplacedUnit(val);
		const repacedUnit2 = getReplacedUnit(val2);
		const input = `.rule { margin: 0.5rem ${val} ${val2} -.2em; }`;
		const output = `.rule {margin: 0.5rem ${repacedUnit} ${repacedUnit2} -.2em;}`;
		const resultOutput = getWrapedOutputWithMedia(input, output);

		await run(input, resultOutput);
	});

	it('should replace the negative px unit with vw', async () => {
		const val = '-4px';
		const val2 = '3px';
		const repacedUnit = getReplacedUnit(val);
		const repacedUnit2 = getReplacedUnit(val2);
		const input = `.rule { margin: 0.5rem ${val} ${val2} -.2em; }`;
		const output = `.rule {margin: 0.5rem ${repacedUnit} ${repacedUnit2} -.2em;}`;
		const resultOutput = getWrapedOutputWithMedia(input, output);

		await run(input, resultOutput);
	});

	it('should replace the positive float px unit with vw', async () => {
		const val = '0.5px';
		const val2 = '0.3px';
		const repacedUnit = getReplacedUnit(val);
		const repacedUnit2 = getReplacedUnit(val2);
		const input = `.rule { margin: 0.5rem ${val} ${val2} -.2em; }`;
		const output = `.rule {margin: 0.5rem ${repacedUnit} ${repacedUnit2} -.2em;}`;
		const resultOutput = getWrapedOutputWithMedia(input, output);

		await run(input, resultOutput);
	});

	it('should replace the negative float px unit with vw', async () => {
		const val = '-0.4px';
		const val2 = '-0.2px';
		const repacedUnit = getReplacedUnit(val);
		const repacedUnit2 = getReplacedUnit(val2);
		const input = `.rule { margin: 0.5rem ${val} ${val2} -.2em; }`;
		const output = `.rule {margin: 0.5rem ${repacedUnit} ${repacedUnit2} -.2em;}`;
		const resultOutput = getWrapedOutputWithMedia(input, output);

		await run(input, resultOutput);
	});

	it('should replace the zero px without unit', async () => {
		const val = '0px';
		const val2 = '-0.2px';
		const repacedUnit2 = getReplacedUnit(val2);
		const input = `.rule { margin: 0.5rem ${val} ${val2} -.2em; }`;
		const output = `.rule {margin: 0.5rem 0 ${repacedUnit2} -.2em;}`;
		const resultOutput = getWrapedOutputWithMedia(input, output);

		await run(input, resultOutput);
	});

	it('should replace the negative zero px without unit', async () => {
		const val = '-0px';
		const val2 = '-42px';
		const repacedUnit2 = getReplacedUnit(val2);
		const input = `.rule { margin: 0.5rem ${val} ${val2} -.2em; }`;
		const output = `.rule {margin: 0.5rem 0 ${repacedUnit2} -.2em;}`;
		const resultOutput = getWrapedOutputWithMedia(input, output);

		await run(input, resultOutput);
	});

	it('if declaration has !important should replace the px unit with vw and include !important ', async () => {
		const val = '12px';
		const val2 = '13px';
		const repacedUnit = getReplacedUnit(val);
		const repacedUnit2 = getReplacedUnit(val2);
		const input = `.rule { margin: 0.5rem ${val} ${val2} -.2em !important; }`;
		const output = `.rule {margin: 0.5rem ${repacedUnit} ${repacedUnit2} -.2em !important; }`;
		const resultOutput = getWrapedOutputWithMedia(input, output);

		await run(input, resultOutput);
	});

	it('should not replace px to vw if has before ignore comment', async () => {
		const val = '12px';
		const val2 = '42px';
		const repacedUnit = getReplacedUnit(val);
		const repacedUnit2 = getReplacedUnit(val2);
		const input = `
			.rule {
				/* ${ignoreNextComment} */
				padding: 1px;
				margin: 0.5rem ${val} ${val2} -.2em;
			}
		`;
		const inputWithoutComment = `
			.rule {
				padding: 1px;
				margin: 0.5rem ${val} ${val2} -.2em;
			}
		`;
		const output = `
			.rule {
				margin: 0.5rem ${repacedUnit} ${repacedUnit2} -.2em;
			}
		`;
		const resultOutput = getWrapedOutputWithMedia(inputWithoutComment, output);

		await run(input, resultOutput);
	});

	it('should not replace values with an uppercase P or X', async () => {
		const val = '12px';
		const val2 = '42px';
		const repacedUnit = getReplacedUnit(val);
		const repacedUnit2 = getReplacedUnit(val2);
		const input = `.rule { margin: ${val} calc(100% - 14PX); height: calc(100% - ${val2}); font-size: 12Px; line-height: ${val}; }`;
		const output = `.rule { margin: ${repacedUnit} calc(100% - 14PX); height: calc(100% - ${repacedUnit2}); line-height: ${repacedUnit}; }`;
		const resultOutput = getWrapedOutputWithMedia(input, output);

		await run(input, resultOutput);
	});

	it('should not replace px to vw in `url()`', async () => {
		const val = '12px';
		const repacedUnit = getReplacedUnit(val);
		const input = `.rule { background: url(16px.jpg); font-size: ${val}; }`;
		const output = `.rule { font-size: ${repacedUnit}; }`;
		const resultOutput = getWrapedOutputWithMedia(input, output);

		await run(input, resultOutput);
	});

	it('should not replace px to vw in double quotes or single quotes', async () => {
		const val = '12px';
		const repacedUnit = getReplacedUnit(val);
		const input = `.rule { content: '16px'; font-family: "16px"; font-size: ${val}; }`;
		const output = `.rule { font-size: ${repacedUnit}; }`;
		const resultOutput = getWrapedOutputWithMedia(input, output);

		await run(input, resultOutput);
	});
});

describe('minUnitValue', () => {
	it('should replace the px unit with vw if value is bigger then minUnitValue', async () => {
		const val = '2px';
		const val2 = '3px';
		const repacedUnit = getReplacedUnit(val2);
		const input = `.rule { margin: 0.5rem ${val} ${val2} -.2em; }`;
		const output = `.rule {margin: 0.5rem ${val} ${repacedUnit} -.2em;}`;
		const resultOutput = getWrapedOutputWithMedia(input, output);

		await run(input, resultOutput, { minUnitValue: 2 });
	});

	it('should replace the negative px unit with vw if value is bigger then minUnitValue', async () => {
		const val = '-2px';
		const val2 = '-1px';
		const repacedUnit = getReplacedUnit(val2);
		const input = `.rule { margin: 0.5rem ${val} ${val2} -.2em; }`;
		const output = `.rule {margin: 0.5rem ${val} ${repacedUnit} -.2em;}`;
		const resultOutput = getWrapedOutputWithMedia(input, output);

		await run(input, resultOutput, { minUnitValue: -2 });
	});

	it('should replace the positive float px unit with vw if value is bigger then minUnitValue', async () => {
		const val = '1.3px';
		const val2 = '0.1px';
		const repacedUnit = getReplacedUnit(val);
		const input = `.rule { margin: 0.5rem ${val} ${val2} -.2em; }`;
		const output = `.rule {margin: 0.5rem ${repacedUnit} ${val2} -.2em;}`;
		const resultOutput = getWrapedOutputWithMedia(input, output);

		await run(input, resultOutput, { minUnitValue: 0.1 });
	});

	it('should replace the negative float px unit with vw if value is bigger then minUnitValue', async () => {
		const val = '-0.3px';
		const val2 = '-0.1px';
		const repacedUnit = getReplacedUnit(val2);
		const input = `.rule { margin: 0.5rem ${val} ${val2} -.2em; }`;
		const output = `.rule {margin: 0.5rem ${val} ${repacedUnit} -.2em;}`;
		const resultOutput = getWrapedOutputWithMedia(input, output);

		await run(input, resultOutput, { minUnitValue: -0.3 });
	});
});

describe('selectorBlackList', () => {
	it('should replace the px unit with vw if rule not included to selectorBlackList', async () => {
		const val = '13px';
		const val2 = '12px';
		const repacedUnit = getReplacedUnit(val);
		const repacedUnit2 = getReplacedUnit(val2);
		const input = `
			.rule { margin: 0.5rem ${val} ${val2} -.2em; }
			.rule2 { margin: 0.5rem ${val} ${val2} -.2em; }
			.norulematch { margin: 0.5rem ${val} ${val2} -.2em; }
			.not { margin: 0.5rem ${val} ${val2} -.2em;}
			.rule, .not2 { margin: 0.5rem ${val} ${val2} -.2em;}
			body { margin: 0.5rem ${val} ${val2} -.2em;}
			.body { margin: 0.5rem ${val} ${val2} -.2em;}
		`;
		const output = `
			.not { margin: 0.5rem ${repacedUnit} ${repacedUnit2} -.2em;}
			.not2 { margin: 0.5rem ${repacedUnit} ${repacedUnit2} -.2em;}
			.body { margin: 0.5rem ${repacedUnit} ${repacedUnit2} -.2em;}
		`;
		const resultOutput = getWrapedOutputWithMedia(input, output);

		await run(input, resultOutput, { selectorBlackList: ['rule', /^body$/] });
	});
});

describe('unitWidthCssVar', () => {
	it('should replace the px unit with calc(with inside css var)', async () => {
		const val = '13px';
		const val2 = '12px';
		const repacedUnit = getReplacedUnit(val).replace('vw', '');
		const repacedUnit2 = getReplacedUnit(val2).replace('vw', '');
		const input = `.rule { margin: 0.5rem ${val} ${val2} -.2em; }`;
		const output = `.rule {
			margin: 0.5rem calc(${repacedUnit} * var(--vv, 1vw)) calc(${repacedUnit2} * var(--vv, 1vw)) -.2em;
		}`;
		const resultOutput = getWrapedOutputWithMedia(input, output);

		await run(input, resultOutput, { unitWidthCssVar: 'var(--vv, 1vw)' });
	});
});

describe('AtRules', () => {
	it('should not replace the px unit with vw inside media with max-width)', async () => {
		const val = '13px';
		const val2 = '12px';
		const repacedUnit = getReplacedUnit(val);
		const repacedUnit2 = getReplacedUnit(val2);
		const input = `
			.rule { margin: 0.5rem ${val} ${val2} -.2em; }
			@media (max-width: 1200px) {
				.a {font-size: 12px;}
			}
			@media (min-width: 500px) and (max-width: 1200px) {
				.a {font-size: 12px;}
			}
			@supports (display: flex) {
				.b {font-size: ${val2};}
			}
		`;
		const output = `
			.rule {margin: 0.5rem ${repacedUnit} ${repacedUnit2} -.2em;}
			@supports (display: flex) {
				.b {font-size: ${repacedUnit2};}
			}
		`;
		const resultOutput = getWrapedOutputWithMedia(input, output);

		await run(input, resultOutput);
	});

	it('should not replace the px unit with vw inside invalid atRules)', async () => {
		const input = `
			@scope (.article-body) {
				.a {font-size: 12px;}
			}
		`;
		const output = `${input}`;

		await run(input, output);
	});

	it('should move replaced px unit with vw inside media min-width to outside min-width)', async () => {
		const val = '13px';
		const repacedUnit = getReplacedUnit(val);
		const input = `
			.a {color:red; font-size: ${val};}

			@media (min-width: 1200px) {
				.b {color:red; font-size: ${val};}
			}

			@supports (display: flex) {
				.c {color:red; font-size: ${val};}

				@media (min-width: 1200px) {
					.d {color:red; font-size: ${val};}
				}
			}

			@supports (display: grid) {
				.e {color:red; font-size: ${val};}

				@media (min-width: 1200px) {
					.f {color:red; font-size: ${val};}
				}

				@media (min-width: 1000px) {
					.g {color:red; font-size: ${val};}
				}
			}
		`;
		const output = `
			.a {font-size: ${repacedUnit};}
			.b {font-size: ${repacedUnit};}

			@supports (display: flex) {
				.c {font-size: ${repacedUnit};}
				.d {font-size: ${repacedUnit};}
			}

			@supports (display: grid) {
				.e {font-size: ${repacedUnit};}
				.f {font-size: ${repacedUnit};}
				.g {font-size: ${repacedUnit};}
			}
		`;
		const resultOutput = getWrapedOutputWithMedia(input, output);

		await run(input, resultOutput);
	});

	it('should copy @keyframes if has replaced px unit with vw)', async () => {
		const val = '10px';
		const repacedUnit = getReplacedUnit(val);
		const input = `
			@keyframes slideIn {
				from {
					transfrom: transateX(0%);
				}

				to {
					transfrom: transateX(100%);
				}
			}

			@keyframes slideInWithPx {
				from {
					transfrom: transateX(${val});
				}

				to {
					transfrom: transateX(100%);
				}
			}

			@supports (display: flex) {
				@keyframes slideInSub {
					from {
						transfrom: transateX(0%);
					}

					to {
						transfrom: transateX(100%);
					}
				}

				@keyframes slideInSubWithPx {
					from {
						transfrom: transateX(${val});
					}

					to {
						transfrom: transateX(100%);
					}
				}
			}
		`;
		const output = `
			@keyframes slideInWithPx {
				from {
					transfrom: transateX(${repacedUnit});
				}

				to {
					transfrom: transateX(100%);
				}
			}

			@supports (display: flex) {
				@keyframes slideInSubWithPx {
					from {
						transfrom: transateX(${repacedUnit});
					}

					to {
						transfrom: transateX(100%);
					}
				}
			}
		`;
		const resultOutput = getWrapedOutputWithMedia(input, output);

		await run(input, resultOutput);
	});

	it('should remove empty at rules which not have replaced unit)', async () => {
		const val = '10px';
		const repacedUnit = getReplacedUnit(val);
		const input = `
			@media (hover: hover) {}

			@media (min-width: 1200px) {}
			@media (max-width: 1200px) {}
			@media (min-width: 1200px) and (max-width: 1200px) {}

			@media (hover: hover) {
				.a {
					font-size: ${val};
				}

				@media (min-width: 1200px) {
				}

				@media (min-width: 1300px) {
				}

				@supports (display: flex) {
					.b {
						font-size: ${val};
					}
				}

				@supports (display: grid) {
					.c {
						color: red;
					}
				}
			}

			@supports (display: flex) {
				@media (hover: hover) {}

				@media (hover: hover) {
					.c {
						font-size: ${val};
					}
				}
			}

			@supports (display: flex) {
				@media (hover: hover) {
					.d {
						font-size: ${val};
					}
				}
				@media (hover: hover) {
					@media (prefers-color-scheme: dark) {
						.t {
							color: red;
						}
					}
				}
				@media (hover: hover) {
					@media (prefers-color-scheme: dark) {
						.d {
							font-size: ${val};
						}
					}
					@media (prefers-color-scheme: no-preference) {
					}
					@media (prefers-color-scheme: light) {
					}
				}
			}
		`;
		const output = `
			@media (hover: hover) {
				.a {
					font-size: ${repacedUnit};
				}

				@supports (display: flex) {
					.b {
						font-size: ${repacedUnit};
					}
				}
			}

			@supports (display: flex) {
				@media (hover: hover) {
					.c {
						font-size: ${repacedUnit};
					}
				}
			}

			@supports (display: flex) {
				@media (hover: hover) {
					.d {
						font-size: ${repacedUnit};
					}
				}
				@media (hover: hover) {
					@media (prefers-color-scheme: dark) {
						.d {
							font-size: ${repacedUnit};
						}
					}
				}
			}
		`;
		const resultOutput = getWrapedOutputWithMedia(input, output);

		await run(input, resultOutput);
	});

	it('should not add empty at rules which not have replaced unit)', async () => {
		const input = `
			.a {
				color: red;
			}

			@media (hover: hover) {
				.a {
					color: green;
				}
			}
		`;
		const output = `${input}`;

		await run(input, output);
	});
});
