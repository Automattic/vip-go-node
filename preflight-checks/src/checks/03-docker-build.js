import chalk from 'chalk';
import packageJson from '../package';
import inquirer from 'inquirer';
import process from 'process';

import {executeShell} from "../utils/shell";
import waait from "waait";

const ALLOWED_NODEJS_VERSIONS = [ '16', '14', '12' ];

module.exports = {
	name: 'Building Docker image...',
	excerpt: `Trying to build a Docker image for the project, using a production-like build script`,
	run: async ( applicationPackage = packageJson, options ) => {
		const PORT = options.port;

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

		// Try to build the docker image
		console.log( chalk.blue( '  Info:' ), `Using Node.js ${ chalk.yellow(nodeVersion) } to build the image` );
		try {
			console.log( chalk.blue( '  Info:' ), 'Building Docker image...' );
			const subprocess = executeShell( `bash ${ __dirname }/../docker/build.sh`, {
				'NODE_VERSION': nodeVersion,
			} );

			if ( options.verbose ) {
				subprocess.stdout.pipe( process.stdout );
			}

			await subprocess; // Wait for the Promise to finish.
		} catch ( error ) {
			console.log( chalk.red( '  Error:' ), `There was an error building the Docker image.` );
			console.log( chalk.red( error.shortMessage ) );
			return "failed";
		}

		// Execute the docker image
		const commitSHA = ( await executeShell( 'git rev-parse HEAD' ) ).stdout;
		const imageTag = `vip-preflight-checks:${ commitSHA }`;
		console.log( chalk.blue( '  Info:' ), `Running Docker image on PORT ${ chalk.yellow( PORT ) } for image ${ chalk.yellow(imageTag) }...` );

		try {
			const subprocess = executeShell( `docker run -t -e PORT -p ${ PORT }:${ PORT } ${ imageTag }`, {
				'NODE_VERSION': nodeVersion,
				'PORT': PORT,
			})

			if ( options.verbose ) {
				subprocess.stdout.pipe( process.stdout );
			}

			await waait( options.wait ); // Wait a little, giving time for the server to boot up

		} catch ( error ) {
			console.log( chalk.red( '  Error:' ), `There was an error starting the Docker image.` );
			console.log( chalk.red( error.shortMessage ) );
			return "failed";
		}

		return "success";
	}
}
