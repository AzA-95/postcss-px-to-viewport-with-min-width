import type { Rule as RuleType, Comment, Node, Declaration as DeclarationType, Container } from 'postcss';
import { Rule, AtRule, Declaration } from 'postcss';
import type { OptionsType } from './types';

export const ignoreNextComment = 'px-to-viewport-ignore-next';

// excluding regex trick: http://www.rexegg.com/regex-best-trick.html

// Not anything inside double quotes
// Not anything inside single quotes
// Not anything inside url()
// Any digit followed by px
// !singlequotes|!doublequotes|!url()|pixelunit
export const getUnitRegexp = (unit: string) => {
	return new RegExp(`"[^"]+"|'[^']+'|url\\([^\\)]+\\)|(\\-?\\d*\\.?\\d+)${unit}`, 'g');
};

export const isArray = (param: unknown): param is unknown[] => {
	return Array.isArray(param);
};

export const isRegExp = (param: unknown) => {
	return param instanceof RegExp;
};

export const isExclude = (regex: RegExp, file: string) => {
	if (!isRegExp(regex)) {
		throw new Error('options.exclude should be RegExp.');
	}

	return file.match(regex) !== null;
};

export const isValidAtRule = (atRuleName: string) => {
	const validAtRuleNames = ['media', 'supports', 'keyframes'];

	return validAtRuleNames.includes(atRuleName);
};

export const isKeyframesAtRule = (atRuleName: string) => {
	return atRuleName === 'keyframes';
};

export const isMediaMinWidthOnly = (atRuleParam: string) => {
	return atRuleParam.indexOf('min-width') !== -1 && atRuleParam.indexOf('max-width') === -1;
};

export const isMediaWithMaxWidth = (atRuleParam: string) => {
	return atRuleParam.indexOf('(max-width:') !== -1;
};

export const toFixed = (number: number, precision: number) => {
	const multiplier = 10 ** (precision + 1);
	const wholeNumber = Math.floor(number * multiplier);

	return (Math.round(wholeNumber / 10) * 10) / multiplier;
};

export const createUnitReplace = (options: OptionsType) => {
	return (m: string, $1: string) => {
		if (!$1) return m;

		const { minUnitValue, convertToUnit, viewportWidth, unitPrecision, unitWidthCssVar } = options;

		const pixels = parseFloat($1);

		if (minUnitValue !== undefined && minUnitValue >= pixels) return m;

		const parsedVal = toFixed((pixels / viewportWidth) * 100, unitPrecision);

		if (parsedVal === 0) return '0';

		return unitWidthCssVar ? `calc(${parsedVal} * ${unitWidthCssVar})` : `${parsedVal}${convertToUnit}`;
	};
};

export const isDeclarationExists = (decls: (Comment | DeclarationType)[], prop: string, value: string) => {
	return decls?.some((decl) => {
		if (decl.type === 'decl') {
			return decl.prop === prop && decl.value === value;
		}

		return false;
	});
};

export const isBlacklistedSelector = (blacklist: (string | RegExp)[], selector: string) => {
	return blacklist.some((regex) => {
		if (typeof regex === 'string') {
			return selector.indexOf(regex) !== -1;
		}

		return selector.match(regex);
	});
};

export const createRule = ({ selectors, source }: { selectors: string[]; source: Node['source'] }) => {
	return new Rule({
		selectors,
		source,
	});
};

export const createAtRule = ({ name, params, source }: { name: string; params: string; source: Node['source'] }) => {
	return new AtRule({
		name,
		params,
		source,
	});
};

export const createDeclaration = ({ prop, value, important }: { prop: string; value: string; important?: boolean }) => {
	return new Declaration({
		prop,
		value,
		important,
	});
};

export const getModifiedDeclaration = (declaration: Declaration, options: OptionsType) => {
	const unitRegex = getUnitRegexp(options.unitToConvert);

	if (declaration.value.indexOf(options.unitToConvert) === -1) return null;

	// prev declaration is ignore conversion comment at same line
	const prev = declaration.prev();

	if (prev && prev.type === 'comment' && prev.text === ignoreNextComment) {
		// remove comment
		prev.remove();
		return null;
	}

	const value = declaration.value.replace(unitRegex, createUnitReplace(options));

	if (isDeclarationExists(declaration.parent!.nodes as DeclarationType[], declaration.prop, value)) return null;

	return createDeclaration({
		prop: declaration.prop,
		value,
		important: declaration.important,
	});
};

export const getModifiedRule = (rule: RuleType, options: OptionsType) => {
	const selectors: string[] = [];

	rule.selectors.forEach((selector) => {
		if (!isBlacklistedSelector(options.selectorBlackList, selector)) {
			selectors.push(selector);
		}
	});

	if (selectors.length === 0) return null;

	const createdRule = createRule({ selectors, source: rule.source });

	rule.walkDecls((declaration) => {
		const modifiedDeclaration = getModifiedDeclaration(declaration, options);

		if (modifiedDeclaration) {
			createdRule.append(modifiedDeclaration);
		}
	});

	return createdRule.nodes?.length > 0 ? createdRule : null;
};

export const getKeyframesIfMatch = (node: AtRule, options: OptionsType) => {
	let hasUnitToReplace = false;
	const clonedKeyframes = node.clone().removeAll();

	node.each((childRule) => {
		const modifiedRule = getModifiedRule(childRule as Rule, options);

		if (modifiedRule) {
			hasUnitToReplace = true;
			clonedKeyframes.append(modifiedRule);
			return;
		}

		// without childRule.clone() rule will be removed from prev position source
		clonedKeyframes.append(childRule.clone());
	});

	// return only @keyframes which has replaced unit
	return hasUnitToReplace ? clonedKeyframes : null;
};

export const removeEmptyAtRules = (atRule: AtRule) => {
	const parentRule = atRule.clone();

	const removeEmptyAtRulesByDeep = (childRule: AtRule) => {
		if (childRule.nodes) {
			let i = childRule.nodes.length;

			// Used while because node might be removed in loop
			while (i--) {
				const node = childRule.nodes[i];
				// nested at rules
				if (node.type === 'atrule') {
					removeEmptyAtRulesByDeep(node);

					if (!node.nodes || node.nodes.length === 0) {
						node.remove();
					}
				}
			}
		}
	};

	removeEmptyAtRulesByDeep(parentRule);

	if (parentRule.nodes && parentRule.nodes.length > 0) return parentRule;

	return null;
};

export const buildAtRulesTree = (nodes: Container['nodes'], parent: AtRule, options: OptionsType) => {
	if (nodes && nodes.length > 0) {
		nodes.forEach((node) => {
			// nested atRules
			if (node.type === 'atrule' && !isMediaWithMaxWidth(node.params)) {
				// skip create parent with min-width
				if (isMediaMinWidthOnly(node.params)) {
					buildAtRulesTree(node.nodes, parent, options);
					return;
				}

				// copy @keyframes only if has unit to replace
				if (isKeyframesAtRule(node.name)) {
					const keyframes = getKeyframesIfMatch(node, options);

					// add only @keyframes which has replaced unit
					if (keyframes) {
						parent.append(keyframes);
					}

					return;
				}

				const currentAtRule = createAtRule({ name: node.name, params: node.params, source: node.source });
				parent.append(currentAtRule);

				buildAtRulesTree(node.nodes, currentAtRule, options);
			}

			if (node.type === 'rule') {
				const rule = getModifiedRule(node, options);

				if (rule) {
					parent.append(rule);
				}
			}
		});
	}

	return parent;
};
