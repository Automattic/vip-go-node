import chalk from 'chalk';
const waait = require( 'waait' );

const CACHE_HEALTHCHECK_ROUTE = '/cache-healthcheck?';

// Commands
const npmPrune = 'npm prune --production'; // Make sure no extra dependencies are installed
const npmInstall = 'npm install --production';
const npmBuild = 'npm run build';

const chalkNpmInstall = chalk.yellow( npmInstall );
const chalkNpmBuild = chalk.yellow( npmBuild );
const chalkNpmStart = chalk.yellow( "npm start" );
const chalkPORT = chalk.yellow( 'PORT' );
const chalkHealthCheckRoute = chalk.yellow( CACHE_HEALTHCHECK_ROUTE );

const { executeShell } = require('../utils/shell' );

module.exports = {
	name: 'Installing dependencies, building, and starting your app',
	excerpt: `Building and starting the application locally on ${ chalkPORT } and responds to ${ chalkHealthCheckRoute }`,
	run: ( packageJson, { wait, verbose, port } ) => {
		const PORT = port;

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

				// Instead of calling `npm start`, fetch the command from the package.json and run it directly.
				// This allows the child_process to be killed later on, since it was spawned by this script instead
				// of npm. Using the `npm start` would leave behind a zombie process.
				const npmStart = packageJson.scripts.start;

				subprocess = executeShell( npmStart, {
					NODE_ENV: 'production',
					PORT: PORT,
				} );

				if ( verbose ) {
					subprocess.stdout.pipe( process.stdout );
				}

				await waait( wait ); // Wait a little, giving time for the server to boot up

				return "success";
			} )
			.catch( err => {
				console.log( chalk.red( '  Error:' ), `${ err }` );
				subprocess.cancel();
				return 'failed';
			} );
	}
}
