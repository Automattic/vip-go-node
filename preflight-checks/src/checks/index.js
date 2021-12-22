const exports = [
	require( './00-npm-scripts.js' ),
	// Disabled until we can formalize what we will require
	// require( './01-vip-go-package.js' ),
];
const dockerAvailable = true;

if ( dockerAvailable ) {
	exports.push(
		require( './03-docker-build.js' ),
		require( './04-check-healthcheck-route.js' ),
	);
} else {
	exports.push(
		require( './02-local-build.js' ),
		require( './04-check-healthcheck-route.js' ),
	);
}

module.exports = exports;
