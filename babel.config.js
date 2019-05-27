module.exports = function( api ) {
	api.cache( true );

	const config = {
		presets: [ [ '@babel/env' ] ],
		plugins: [ [ '@babel/plugin-transform-runtime' ] ],
	};

	return config;
};
