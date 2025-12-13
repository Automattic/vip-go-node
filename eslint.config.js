const { configs } = require( '@automattic/eslint-plugin-wpvip' );

const config = [
	{
		ignores: [ 'dist/**', 'preflight-checks/**' ],
	},
	...configs.recommended,
	...configs.testing,
	{
		linterOptions: {
			reportUnusedDisableDirectives: 'warn',
		},
	},
];

module.exports = config;
