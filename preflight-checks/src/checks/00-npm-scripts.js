import chalk from 'chalk';
import packageJson from '../package';

const chalkNpmStart = chalk.yellow( 'npm start' );
const chalkNpmBuild = chalk.yellow( 'npm build' );
const chalkPackageJson = chalk.yellow( 'package.json' );

module.exports = {
	name: 'Checking npm scripts in the project...',
	excerpt: `Checking your ${ chalkPackageJson } for ${ chalkNpmBuild } and ${ chalkNpmStart }`,
	description: 'In VIP Go, we want each application to have an npm build and npm start scripts',
	run: () => {
		const scripts = packageJson.scripts;
		const start = scripts.start;
		const build = scripts.build;
		const serve = scripts.serve;

		if ( ! start ) {
			console.log( chalk.red( '  Error:' ), `Looks like your ${ chalkPackageJson } is missing an ${ chalkNpmStart } script` );
			return 'failed';
		}

		if ( ! build ) {
			console.log( chalk.red( '  Error:' ), `Looks like your ${ chalkPackageJson } is missing an ${ chalkNpmBuild } script` );
			return 'failed';
		}

		if ( serve ) {
			console.log(
				chalk.yellow( '  Warning:' ),
				`Looks like your ${ chalkPackageJson } have an ${ chalk.yellow( 'npm serve' ) } script. ` +
				`Please make sure this is not the script running your application. Your application must be served ` +
				`using ${ chalkNpmStart }.`
			 );
			return 'warning';
		}

		return 'success';
	}
}