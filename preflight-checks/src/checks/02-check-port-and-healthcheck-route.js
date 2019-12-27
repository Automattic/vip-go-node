import chalk from 'chalk';
import packageJson from '../package';
const execa = require( 'execa' );
const waait = require( 'waait' );
const fetch = require( 'node-fetch' );

const CACHE_HEALTHCHECK_ROUTE = '/cache-healthcheck?';
const chalkNpmStart = chalk.yellow( 'npm start' );
const chalkPORT = chalk.yellow( 'PORT' );
const chalkHealthCheckRoute = chalk.yellow( CACHE_HEALTHCHECK_ROUTE );
const chalkVIPGo = chalk.yellow( '@automattic/vip-go' );
const rmfr = require('rmfr');

const currentWorkingDirectory = process.cwd();
const path = require( 'path' );
const node_modules = path.join( currentWorkingDirectory, 'node_modules' );

const envVariables = {
	'VIP_GO_APP_ID': '123',
}

const executeShell = ( command, envVars = {} ) => {
	return execa.command( command, {
		env: Object.assign( envVariables, envVars )
	} );
}

module.exports = {
	name: `Building the app and running ${ chalkNpmStart }...`,
	excerpt: `Checking if your app accepts a ${ chalkPORT } and responds to ${ chalkHealthCheckRoute }`,
	run: async () => {
		const scripts = packageJson.scripts;
		const PORT = Math.floor( Math.random() * ( 4000 - 3000 ) + 3000 ); // Get a PORT between 3000 and 4000

		let subprocess;

		console.log( chalk.blue( '  Info:' ), `Installing dependencies with ${ chalk.yellow( 'npm install' ) }...` );

		return executeShell( 'npm install' )
			.then( () => {
				let buildingCommand = 'VIP_GO_APP_ID=123 npm run build';

				console.log( chalk.blue( '  Info:' ), `Building the project using ${ chalk.yellow( buildingCommand ) }...` );

				return executeShell( buildingCommand );
			} )
			.then( () => {
				console.log( chalk.blue( '  Info:' ), `Removing ${ chalk.yellow( 'node_modules' ) } folder...` );

				return rmfr( node_modules );

			} )
			.then( () => {
				console.log( chalk.blue( '  Info:' ), `Installing production dependencies with ${ chalk.yellow( 'npm install --production' ) }...` );
				return executeShell( 'npm install --production' );
			} )
			.then( () => {
				console.log( chalk.blue( '  Info:' ), `Launching your app on PORT:${ PORT }...` );
				subprocess = execa.shell( `PORT=${ PORT } npm start` );
				return waait( 3000 ); // Wait a little before resolving, giving time for the server to boot up
			} )
			.then( () => {
				const cacheUrl = `http://localhost:${ PORT }${ CACHE_HEALTHCHECK_ROUTE }`;
				console.log( chalk.blue( '  Info:' ), `Sending a GET request to ${ cacheUrl }...` );
				return fetch( cacheUrl );
			} )
			.then( response => {
				const is200 = response.status === 200;

				if ( ! is200 ) {
					throw `Could not get a ${ chalk.yellow( '200 - OK' ) } response from ${ chalkHealthCheckRoute }. ` +
					`Make sure your application accepts a ${ chalkPORT } environment variable. You can simplify this using our ${ chalkVIPGo } package.`;
				}

				subprocess.kill();

				return 'success';
			} )
			.catch( err => {
				console.log( chalk.red( '  Error:' ), `${ err }` );
				subprocess.kill();
				return 'failed';
			} );
	}
}
