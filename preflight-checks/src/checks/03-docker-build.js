import chalk from 'chalk';
import packageJson from '../package';
import execa from "execa";
import findUp from 'find-up';

import fs from 'fs';
import process from 'process';

const chalkVIPGo = chalk.yellow( '@automattic/vip-go' );
const chalkPackageJson = chalk.yellow( 'package.json' );

const envVariables = {
	'VIP_GO_APP_ID': '123',
}

function executeShell( command, envVars = {} ) {
	return execa.command( command, {
		env: Object.assign( {}, envVariables, envVars )
	} );
}

async function findNodeVersion() {
	// Try to fetch a .nvmrc file
	const nvmrcPath = await findUp('.nvmrc');

	if ( nvmrcPath ) {
		let nvmrcFile = fs.openSync( nvmrcPath, 'r' );
		if ( nvmrcFile ) {
			let nodeVersion = fs.readFileSync( nvmrcFile );

			// Validate the version format
			const versionMatch = nodeVersion.toString().match( /([0-9]+\.[0-9]+(?:\.[0-9]+)?)/ );
			if ( versionMatch ) {
				return versionMatch[ 1 ];
			}
		}
	}

	return false;
}

module.exports = {
	name: 'Building Docker image...',
	excerpt: `Trying to build a Docker image for the project, using a production-like build script`,
	run: async ( applicationPackage = packageJson ) => {
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

		// Check for Node version
		let nodeVersion = await findNodeVersion();
		if ( ! nodeVersion ) {
			console.log( chalk.yellow( '  Warning:' ), `Couldn't infer a valid Node.JS from .nvmrc file. Falling back to local node version.` );
			nodeVersion = process.versions.node;
		}
		console.log( chalk.blue( '  Info:' ), `Using Node.js ${ chalk.yellow(nodeVersion) } to build the image` );

		// Get REPO_NAME and REPO_ORG
		const gitConfigPath = await findUp( ".git/config" );
		const gitConfig = fs.openSync( gitConfigPath, 'r' );

		if ( ! gitConfig ) {
			console.log( chalk.red( '  Error:' ), `Couldn't find a valid git repository in the current path.` );
			return "failed";
		}

		const gitOrgRepo = fs.readFileSync( gitConfig ).toString().match(/(wpcomvip\/[\w\d\-_]+)(?:\.git)?/)[ 1 ];
		const gitOrg = gitOrgRepo.split("/")[0];
		const gitRepo = gitOrgRepo.split("/")[1];

		console.log( chalk.blue( '  Info:' ), 'Using GitHub repository', chalk.yellow( `${ gitOrg }/${ gitRepo }` ));

		// Try to build the docker image
		try {
			console.log( chalk.blue( '  Info:' ), 'Building Docker image...' );
			await executeShell( `bash ${ __dirname }/../docker/build.sh`, {
				'REPO_NAME': gitRepo,
				'REPO_ORG': gitOrg,
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
