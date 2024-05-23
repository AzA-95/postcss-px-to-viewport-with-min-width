import del from 'rollup-plugin-delete';
import terser from '@rollup/plugin-terser';
import typescript from '@rollup/plugin-typescript';

export default {
	input: 'src/index.ts',
	output: [
		{
			file: 'dist/index.cjs',
			format: 'cjs',
			sourcemap: false,
			exports: 'auto',
		},
		{
			file: 'dist/index.mjs',
			format: 'esm',
			sourcemap: false,
			exports: 'auto',
		},
	],
	external: ['postcss'],
	plugins: [
		del({
			targets: './dist/*',
		}),
		typescript({
			tsconfig: './tsconfig.json',
			declaration: true,
			declarationDir: './dist/',
			noEmit: false,
			noEmitOnError: true,
			exclude: ['./test/**/*'],
		}),
		terser({
			compress: {
				reduce_funcs: false, // https://github.com/terser/terser/issues/1305
			},
		}),
	],
};
