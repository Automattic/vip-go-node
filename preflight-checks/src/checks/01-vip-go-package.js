import chalk from 'chalk';
import packageJson from '../package';

const chalkVIPGo = chalk.yellow( '@automattic/vip-go' );
const chalkPackageJson = chalk.yellow( 'package.json' );

module.exports = {
	name: 'Checking usage of @automattic/vip-go...',
	excerpt: `Checking if the project is using our helper ${ chalkVIPGo }`,
	run: async ( applicationPackage = packageJson ) => {
		const dependencies = applicationPackage.dependencies;
		const VIPGoDependency = dependencies[ '@automattic/vip-go' ];

		if ( ! VIPGoDependency ) {
			console.log( chalk.red( '  Error:' ), `Looks like your ${ chalkPackageJson } is missing our ${ chalkVIPGo } helper in the production dependencies.` );
			return 'failed';
		}

		return 'success';
	}
}