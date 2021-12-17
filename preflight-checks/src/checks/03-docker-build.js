import chalk from 'chalk';
import packageJson from '../package';
import execa from "execa";
import inquirer from 'inquirer';
import process from 'process';

const ALLOWED_NODEJS_VERSIONS = [ '16', '14', '12' ];

const envVariables = {
	'VIP_GO_APP_ID': 'unknown',
	'VIP_GO_APP_NAME': 'unknown',
	'VIP_GO_APP_ENVIRONMENT': 'local',
}

function executeShell( command, envVars = {} ) {
	return execa.command( command, {
		env: Object.assign( {}, envVariables, envVars )
	} );
}

module.exports = {
	name: 'Building Docker image...',
	excerpt: `Trying to build a Docker image for the project, using a production-like build script`,
	run: async ( applicationPackage = packageJson, options ) => {
		// Check if Docker is installed
		try {
			const dockerShell = await executeShell('docker -v' );

			if ( dockerShell.exitCode !== 0 || ! dockerShell.stdout ) {
				throw new Error;
			}

			const dockerVersion = dockerShell.stdout.match(/Docker version ([0-9]+\.[0-9]+(?:\.[0-9]+)?)/)[ 1 ];
			console.log( chalk.blue( '  Info:' ), `Found Docker Engine ${ chalk.yellow(dockerVersion) }` );
		} catch ( error ) {
			console.log( chalk.yellow( '  Warning:' ), `Looks like your environment is missing Docker. To ensure the best`,
				`compatibility with VIP Go, we recommend running the tests on an environment with Docker installed.` );
			return 'warning';
		}


		// Get the NodeJS version
		let nodeVersion = process.versions.node;

		// Check for the CLI parameter
		if ( options['node-version'] && ALLOWED_NODEJS_VERSIONS.includes( options['node-version'].toString() ) ) {
			nodeVersion = options['node-version'];
		} else {
			if ( 0 !== options['node-version'] ) {
				console.log( chalk.yellow( '  Warning:' ), `The Node.JS version picked with`, chalk.bold( '--node-version' ) , `is not valid. Please pick a supported major version.` );
			}

			try {
				// Ask for Node version
				const nodeVersionPrompt = await inquirer.prompt( {
					type: 'list',
					name: 'nodeVersion',
					message: 'Please select a major Node.JS version:',
					choices: ALLOWED_NODEJS_VERSIONS,
				} );

				nodeVersion = nodeVersionPrompt['nodeVersion'];
			} catch( error ) {
				console.log( chalk.yellow( '  Warning:' ), `There was an error selecting the version you specified. Defaulting to ${ nodeVersion }.` );
				console.log( `  You can also select a specific Node version using the`, chalk.bold('--node-version <VERSION>') ,`argument.`)
			}
		}

		console.log( chalk.blue( '  Info:' ), `Using Node.js ${ chalk.yellow(nodeVersion) } to build the image` );

		// Try to build the docker image
		try {
			console.log( chalk.blue( '  Info:' ), 'Building Docker image...' );
			await executeShell( `bash ${ __dirname }/../docker/build.sh`, {
				'NODE_VERSION': nodeVersion,
			} );
		} catch ( error ) {
			console.log( chalk.red( '  Error:' ), `There was an error building the Docker image. Build error output below: ` );
			console.log( chalk.red( error.shortMessage ) );
			console.log( error.stderr );
			return "failed";
		}

		return "success";
	}
}
