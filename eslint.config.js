const { configs } = require( '@automattic/eslint-plugin-wpvip' );

const config = [
	{
		ignores: [ 'dist/**', 'preflight-checks/**' ],
	},
	...configs.recommended,
	...configs.typescript,
	{
		linterOptions: {
			reportUnusedDisableDirectives: 'warn',
		},
	},
];

module.exports = config;
