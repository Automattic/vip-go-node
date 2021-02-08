import chalk from 'chalk';
const execa = require( 'execa' );
const waait = require( 'waait' );
const fetch = require( 'node-fetch' );

const CACHE_HEALTHCHECK_ROUTE = '/cache-healthcheck?';
const chalkNpmStart = chalk.yellow( 'npm start' );
const chalkPORT = chalk.yellow( 'PORT' );
const chalkHealthCheckRoute = chalk.yellow( CACHE_HEALTHCHECK_ROUTE );
const chalkVIPGo = chalk.yellow( '@automattic/vip-go' );

const envVariables = {
	'VIP_GO_APP_ID': '123',
}

const executeShell = ( command, envVars = {} ) => {
	return execa.command( command, {
		env: Object.assign( {}, envVariables, envVars )
	} );
}

module.exports = {
	name: `Building the app and running ${ chalkNpmStart }...`,
	excerpt: `Checking if your app accepts a ${ chalkPORT } and responds to ${ chalkHealthCheckRoute }`,
	run: async ( packageJson, { wait, verbose } ) => {
		const PORT = Math.floor( Math.random() * ( 4000 - 3000 ) + 3000 ); // Get a PORT between 3000 and 4000

		let subprocess;

		console.log( chalk.blue( '  Info:' ), `Installing production dependencies with ${ chalk.yellow( 'npm install --production' ) }...` );

		return executeShell( 'npm install --production' )
			.then( () => {
				let buildingCommand = 'npm run build';

				console.log( chalk.blue( '  Info:' ), `Building the project using ${ chalk.yellow( buildingCommand ) }...` );

				subprocess = executeShell( buildingCommand, {
					VIP_GO_APP_ID: '20030527',
				} );

				if ( verbose ) {
					subprocess.stdout.pipe( process.stdout );
				}

				return subprocess;
			} )
			.then( async () => {
				console.log( chalk.blue( '  Info:' ), `Running ${ chalk.yellow( 'npm start' ) } to launch your app on PORT: ${ PORT }...` );
				subprocess = executeShell( 'npm start', {
					PORT: PORT,
				} );

				if ( verbose ) {
					subprocess.stdout.pipe( process.stdout );
				}

				await waait( wait ); // Wait a little before resolving, giving time for the server to boot up

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

				subprocess.cancel();

				return 'success';
			} )
			.catch( err => {
				console.log( chalk.red( '  Error:' ), `${ err }` );
				subprocess.cancel();
				return 'failed';
			} );
	}
}
