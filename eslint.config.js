const { configs } = require( '@automattic/eslint-plugin-wpvip' );

const config = [
	{
		ignores: [ 'dist/**', 'preflight-checks/**' ],
	},
	...configs.recommended,
	...configs.typescript,
	{
		files: [ 'src/**/*.ts' ],
		rules: {
			'@typescript-eslint/no-namespace': 'off',
		},
	},
	{
		linterOptions: {
			reportUnusedDisableDirectives: 'warn',
		},
	},
];

module.exports = config;
