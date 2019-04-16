import chalk from 'chalk';
import packageJson from '../package';
const execa = require( 'execa' );
const waait = require( 'waait' );
const fetch = require( 'isomorphic-fetch' );

const CACHE_HEALTHCHECK_ROUTE = '/cache-healthcheck?';
const chalkNpmStart = chalk.yellow( 'npm start' );
const chalkPORT = chalk.yellow( 'PORT' );
const chalkHealthCheckRoute = chalk.yellow( CACHE_HEALTHCHECK_ROUTE );
const chalkVIPGo = chalk.yellow( '@automattic/vip-go' );

module.exports = {
	name: `Building the app and running ${ chalkNpmStart }...`,
	excerpt: `Checking if your app accepts a ${ chalkPORT } and responds to ${ chalkHealthCheckRoute }`,
	run: async () => {
		const scripts = packageJson.scripts;
		const PORT = Math.floor( Math.random() * ( 4000 - 3000 ) + 3000 ); // Get a PORT between 3000 and 4000

		let subprocess;

		console.log( chalk.blue( '  Info:' ), `Installing dependencies with ${ chalk.yellow( 'npm install' ) }...` );

		return execa.shell( 'npm install' )
			.then( () => {
				let buildingCommand = 'npm run build';

				if ( scripts[ 'build-ci' ] ) {
					buildingCommand = 'npm run build-ci';
					console.log( chalk.blue( '  Info:' ), `Building the project with ${ chalk.yellow( 'npm run build-ci' ) }...` );
				} else {
					console.log( chalk.blue( '  Info:' ), `Building the project using ${ chalk.yellow( 'npm run build' ) }...` );
				}

				return execa.shell( buildingCommand );
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
