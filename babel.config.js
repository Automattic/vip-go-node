module.exports = function( api ) {
	api.cache( true );

	const config = {
		presets: [
			[
				'@babel/env',
				{
					targets: {
						node: 14,
					},
				},
			],
		],
	};

	return config;
};
