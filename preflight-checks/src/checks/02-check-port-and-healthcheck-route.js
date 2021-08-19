import chalk from 'chalk';
const execa = require( 'execa' );
const waait = require( 'waait' );
const fetch = require( 'node-fetch' );

const CACHE_HEALTHCHECK_ROUTE = '/cache-healthcheck?';

// Commands
const npmPrune = 'npm prune --production'; // Make sure no extra dependencies are installed
const npmInstall = 'npm install --production';
const npmBuild = 'npm run build';
const npmStart = 'npm start';

const chalkNpmInstall = chalk.yellow( npmInstall );
const chalkNpmBuild = chalk.yellow( npmBuild );
const chalkNpmStart = chalk.yellow( npmStart );
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
	name: 'Installing dependencies, building, and starting your app',
	excerpt: `Checking if your app accepts a ${ chalkPORT } and responds to ${ chalkHealthCheckRoute }`,
	run: ( packageJson, { wait, verbose } ) => {
		const PORT = Math.floor( Math.random() * 1000 ) + 3001; // Get a PORT from 3001 and 3999

		let subprocess;

		console.log( chalk.blue( '  Info:' ), `Installing dependencies using ${ chalkNpmInstall }...` );

		return executeShell( npmPrune )
			.then( () => executeShell( npmInstall ) )
			.then( () => {
				console.log( chalk.blue( '  Info:' ), `Building the project using ${ chalkNpmBuild }...` );

				subprocess = executeShell( npmBuild, {
					NODE_ENV: 'production',
					VIP_GO_APP_ID: '20030527',
				} );

				if ( verbose ) {
					subprocess.stdout.pipe( process.stdout );
				}

				return subprocess;
			} )
			.then( async () => {
				console.log( chalk.blue( '  Info:' ), `Running your app with ${ chalkNpmStart } on PORT: ${ PORT }...` );
				subprocess = executeShell( npmStart, {
					NODE_ENV: 'production',
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
