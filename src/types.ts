export type OptionsType = {
	minUnitValue?: number;
	unitPrecision: number;
	unitToConvert: string;
	convertToUnit: string;
	exclude?: RegExp | RegExp[];
	viewportWidth: number;
	selectorBlackList: (string | RegExp)[];
	unitWidthCssVar?: string;
};

export type OptionsPartialType = Partial<OptionsType>;
