import type { PluginCreator, Rule, AtRule } from 'postcss';
import type { OptionsType, OptionsPartialType } from './types';
import {
	isRegExp,
	isArray,
	isExclude,
	isValidAtRule,
	isKeyframesAtRule,
	isMediaWithMaxWidth,
	isMediaMinWidthOnly,
	createAtRule,
	getModifiedRule,
	getKeyframesIfMatch,
	removeEmptyAtRules,
	buildAtRulesTree,
} from './utils';

const defaultOptions: Omit<OptionsType, 'exclude' | 'minUnitValue' | 'unitWidthCssVar'> = {
	unitPrecision: 4,
	unitToConvert: 'px',
	convertToUnit: 'vw',
	viewportWidth: 1280,
	selectorBlackList: [],
};

const creator: PluginCreator<OptionsPartialType> = (opts?: OptionsPartialType) => {
	const options = {
		...defaultOptions,
		...opts,
	};

	let rulesStore: Rule[] = [];
	let atRulesStore: AtRule[] = [];

	// only hellper function for prevent DRY has side effect
	const addAtRuleToStore = (atRule: AtRule) => {
		atRulesStore.push(atRule);
	};

	// only hellper function for prevent DRY has side effect
	const addValidRulesToStore = (rule: Rule) => {
		const modifiedRule = getModifiedRule(rule, options);

		if (modifiedRule) {
			rulesStore.push(modifiedRule);
		}
	};

	// only hellper function for prevent DRY
	const createAtRuleAndAddToStore = (atRule: AtRule) => {
		const createdAtRule = createAtRule({ name: atRule.name, params: atRule.params, source: atRule.source });
		const resultAtRulesTree = buildAtRulesTree(atRule.nodes, createdAtRule, options);
		const resultAtRules = removeEmptyAtRules(resultAtRulesTree);

		// prevent adding empty atRules
		if (resultAtRules) {
			addAtRuleToStore(resultAtRules as AtRule);
		}
	};

	return {
		postcssPlugin: 'postcss-px-to-vw',
		Once(root) {
			const { exclude } = options;
			const file = root.source?.input.file || null;

			if (exclude && file) {
				if (isRegExp(exclude) || isArray(exclude)) {
					const excludeFiles = isArray(exclude) ? exclude : [exclude];

					// here not used (for of) so eslint report error not recomended by airnb config
					for (let i = 0; i < excludeFiles.length; i++) {
						if (isExclude(excludeFiles[i], file)) return;
					}
				} else {
					throw new Error('options.exclude should be RegExp or Array of RegExp.');
				}
			}

			root.each((rule) => {
				if (rule.type === 'atrule' && isValidAtRule(rule.name) && !isMediaWithMaxWidth(rule.params)) {
					if (isKeyframesAtRule(rule.name)) {
						const keyframes = getKeyframesIfMatch(rule, options);

						// add only @keyframes which has replaced unit
						if (keyframes) {
							addAtRuleToStore(keyframes);
						}

						return;
					}

					if (isMediaMinWidthOnly(rule.params)) {
						rule.each((childRule) => {
							// add to rules store if parent has media min-width only
							if (childRule.type === 'rule') {
								addValidRulesToStore(childRule);
								return;
							}

							// nested atrules
							if (childRule.type === 'atrule') {
								createAtRuleAndAddToStore(childRule);
							}
						});

						return;
					}

					createAtRuleAndAddToStore(rule);
					return;
				}

				if (rule.type === 'rule') {
					addValidRulesToStore(rule);
				}
			});

			const atRuleRoot = createAtRule({
				name: 'media',
				params: `(min-width: ${options.viewportWidth}${options.unitToConvert})`,
				source: root.source,
			});

			// First add rules
			rulesStore.forEach((rule) => {
				atRuleRoot.append(rule);
			});

			// Then add atRules
			atRulesStore.forEach((rule) => {
				atRuleRoot.append(rule);
			});

			// prevent ading empty rules
			if (atRuleRoot.nodes && atRuleRoot.nodes.length > 0) {
				root.append(atRuleRoot);
			}

			rulesStore = [];
			atRulesStore = [];
		},
	};
};

creator.postcss = true;

export default creator;
