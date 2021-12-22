const execa = require("execa");

// 1. Validate NPM scripts
const exports = [
	require( './00-npm-scripts.js' ),
	// Disabled until we can formalize what we will require
	// require( './01-vip-go-package.js' ),
];


// 2. Build application (Docker or locally)
let dockerAvailable = true;
try {
	execa.commandSync('docker -v' );
} catch(err) {
	dockerAvailable = false;
}

if ( dockerAvailable ) {
	exports.push(
		require( './03-docker-build.js' ),
	);
} else {
	exports.push(
		require( './02-local-build.js' ),
	);
}

// 3. Run health-check validation
exports.push( require( './04-check-healthcheck-route.js' ) );

module.exports = exports;
