# postcss-px-to-viewport-with-min-width

A plugin for [PostCSS](https://github.com/postcss/postcss) that generates viewport units (vw, vh, vmin, vmax) from pixel units.

## Demo

If your project involves a fixed width, this script will help to convert pixels into viewport units and wrap replaced units with @media min-width rules.
This plugin useful for desktops sites (Including this plugin and setup breakpoint min-width and site will be optimized to big screen size)

### Input

```css
.class {
	margin: -10px 0.5vh;
	padding: 5vmin 9.5px 1px;
	border: 3px solid black;
	border-bottom-width: 1px;
	font-size: 14px;
	line-height: 20px;
}

.class2 {
	padding-top: 10px;
	/* px-to-viewport-ignore-next */
	padding-bottom: 10px;
	/* Any other comment */
	border: 1px solid black;
	margin-bottom: 1px;
	font-size: 20px;
	line-height: 30px;
}

@media (min-width: 750px) {
	.class3 {
		font-size: 16px;
		line-height: 22px;
	}
}

@media (max-width: 1250px) {
	.class4 {
		font-size: 16px;
		line-height: 22px;
	}
}

@support (display: flex) {
	.class5 {
		color: red;
		font-size: 12px;
	}

	@media (hover: hover) {
		.class6 {
			font-size: 12px;
		}
	}
}

@keyframes slideWithoutPx {
	from {
		transform: translateX(0%);
	}

	to {
		transform: translateX(100%);
	}
}

@keyframes slideWithPx {
	from {
		color: red;
		transform: translateX(10px);
	}

	to {
		color: black;
		transform: translateX(100%);
	}
}
```

### Output

```css
/* Not touched see the last @media */
.class {
	color: red;
	margin: -10px 0.5vh;
	padding: 5vmin 9.5px 1px;
	border: 3px solid black;
	border-bottom-width: 1px;
	font-size: 14px;
	line-height: 20px;
}

.class2 {
	padding-top: 10px;
	padding-bottom: 10px;
	/* Any other comment */
	border: 1px solid black;
	margin-bottom: 1px;
	font-size: 20px;
	line-height: 30px;
}

@media (min-width: 750px) {
	.class3 {
		font-size: 16px;
		line-height: 22px;
	}
}

@media (max-width: 1250px) {
	.class4 {
		font-size: 16px;
		line-height: 22px;
	}
}

@support (display: flex) {
	.class5 {
		color: red;
		font-size: 12px;
	}

	@media (hover: hover) {
		.class6 {
			font-size: 12px;
		}
	}
}

@keyframes slideWithoutPx {
	from {
		transform: translateX(0%);
	}

	to {
		transform: translateX(100%);
	}
}

@keyframes slideWithPx {
	from {
		color: red;
		transform: translateX(10px);
	}

	to {
		color: black;
		transform: translateX(100%);
	}
}

/* Changes will be add here. Default breakpoint is 1280px 
Here only tranformed styles will be Other styles how (color) etc will not be here */
@media (min-width: 1280px) {
	.class {
		margin: -0.7812vw 0.5vh;
		padding: 5vmin 0.7421vw 0.07812vw;
		border: 0.2343vw solid black;
		border-bottom-width: 0.07812vw;
		font-size: 1.0937vw;
		line-height: 1.5625vw;
	}

	.class2 {
		padding-top: 0.7812vw;
		/* Any other comment */
		border: 0.07812vw solid black;
		margin-bottom: 0.07812vw;
		font-size: 1.5625vw;
		line-height: 2.3437vw;
	}

	/* (min-width: 750px) (will be unwrapped regardless of value) see above class3 */
	.class3 {
		font-size: 1.25vw;
		line-height: 1.7187vw;
	}

	/* (max-width: 1250px) (will be ignored regardless of value) see above class4 */

	@support (display: flex) {
		.class5 {
			font-size: 0.9375vw;
		}

		@media (hover: hover) {
			.class6 {
				font-size: 0.9375vw;
			}
		}
	}

	/* @keyframes slideWithoutPx (see above will be ignored because not have replaced style) */

	@keyframes slideWithPx {
		from {
			color: red;
			transform: translateX(0.9375vw);
		}

		to {
			color: black;
			transform: translateX(100%);
		}
	}
}
```

## Getting Started

### Installation

Add via npm

```
$ npm install --save-dev git+https://github.com/AzA-95/postcss-px-to-viewport-with-min-width.git
```

### Usage

Default Options:

```js
{
  unitToConvert: 'px',
  convertToUnit: 'vw',
  viewportWidth: 1280,
  unitPrecision: 4,
  selectorBlackList: [],
  exclude: undefined,
  minUnitValue: undefined,
  unitWidthCssVar: undefined,
}
```

-   `unitToConvert` (String) unit to convert, by default, it is px.
-   `convertToUnit` (String) Expected units, by default, it is vw.
-   `viewportWidth` (Number) The width of the viewport, by default, it is 1280.
-   `unitPrecision` (Number) The decimal numbers to allow the vw units to grow to, by default, it is 4.
-   `selectorBlackList` (Array) The selectors to ignore and leave as px.
    -   If value is string, it checks to see if selector contains the string.
        -   `['body']` will match `.body-class`
    -   If value is regexp, it checks to see if the selector matches the regexp.
        -   `[/^body$/]` will match `body` but not `.body`
-   `minUnitValue` (Number) Set the minimum pixel value to replace.
-   `exclude` (Regexp or Array of Regexp) Ignore some files like 'node_modules'
    -   If value is regexp, will ignore the matches files.
    -   If value is array, the elements of the array are regexp.
-   `unitWidthCssVar` (String) Css var to replace unit with css var instead the option convertToUnit
    -   This option useful for css unit vw so this unit include also scrollbar width
    -   For example with unitWidthCssVar: 'var(--vw, 1vw)' this css .a {font-size: 10px;} will be transfrom to .a {font-size: calc(0.7812 \* var(--vw, 1vw));} and css var --vw you can set in js by calculate wihout scrollbar

#### Ignoring

You can use special comments for ignore conversion of single lines:

-   `/* px-to-viewport-ignore-next */` — on a separate line, prevents conversion on the next line.

Example:

```css
/* example input: */
.class {
	/* px-to-viewport-ignore-next */
	width: 10px;
	padding: 10px;
}

/* example output: */
.class {
	width: 10px;
	padding: 10px;
}
/* Default breakpoint */
@media (min-width: 1280px) {
	.class {
		padding: 0.7812vw;
	}
}
```

There are several more reasons why your pixels may not convert, the following options may affect this:
`selectorBlackList`, `minPixelValue`, `mediaQuery with max-width`, `not inside whitelist at-rule ['@media', '@supports', @keyframes']`, `exclude`.

#### Use with PostCss configuration file

add to your `postcss.config.js`

```js
module.exports = {
	plugins: {
		// ...
		'postcss-px-to-viewport-with-min-width': {
			// options
		},
	},
};
```

#### Use with gulp-postcss

add to your `gulpfile.js`:

```js
var gulp = require('gulp');
var postcss = require('gulp-postcss');
var pxtoviewport = require('postcss-px-to-viewport-with-min-width');

gulp.task('css', function () {
	var processors = [
		pxtoviewport({
			viewportWidth: 1280,
		}),
	];

	return gulp.src(['build/css/**/*.css']).pipe(postcss(processors)).pipe(gulp.dest('build/css'));
});
```

## Running the tests

In order to run tests, you need to install dev-packages:

```
$ npm install
```

Then run the tests via npm script:

```
$ npm run test
```

## License

This project is licensed under the [MIT License](LICENSE).
