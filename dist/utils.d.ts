import type { Rule as RuleType, Comment, Node, Declaration as DeclarationType, Container } from 'postcss';
import { AtRule, Declaration } from 'postcss';
import type { OptionsType } from './types';
export declare const ignoreNextComment = "px-to-viewport-ignore-next";
export declare const getUnitRegexp: (unit: string) => RegExp;
export declare const isArray: (param: unknown) => param is unknown[];
export declare const isRegExp: (param: unknown) => boolean;
export declare const isExclude: (regex: RegExp, file: string) => boolean;
export declare const isValidAtRule: (atRuleName: string) => boolean;
export declare const isKeyframesAtRule: (atRuleName: string) => boolean;
export declare const isMediaMinWidthOnly: (atRuleParam: string) => boolean;
export declare const isMediaWithMaxWidth: (atRuleParam: string) => boolean;
export declare const toFixed: (number: number, precision: number) => number;
export declare const createUnitReplace: (options: OptionsType) => (m: string, $1: string) => string;
export declare const isDeclarationExists: (decls: (Comment | DeclarationType)[], prop: string, value: string) => boolean;
export declare const isBlacklistedSelector: (blacklist: (string | RegExp)[], selector: string) => boolean;
export declare const createRule: ({ selectors, source }: {
    selectors: string[];
    source: Node['source'];
}) => RuleType;
export declare const createAtRule: ({ name, params, source }: {
    name: string;
    params: string;
    source: Node['source'];
}) => AtRule;
export declare const createDeclaration: ({ prop, value, important }: {
    prop: string;
    value: string;
    important?: boolean;
}) => DeclarationType;
export declare const getModifiedDeclaration: (declaration: Declaration, options: OptionsType) => DeclarationType | null;
export declare const getModifiedRule: (rule: RuleType, options: OptionsType) => RuleType | null;
export declare const getKeyframesIfMatch: (node: AtRule, options: OptionsType) => import("postcss/lib/at-rule") | null;
export declare const removeEmptyAtRules: (atRule: AtRule) => import("postcss/lib/at-rule") | null;
export declare const buildAtRulesTree: (nodes: Container['nodes'], parent: AtRule, options: OptionsType) => AtRule;
