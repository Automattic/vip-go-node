import chalk from 'chalk';

module.exports = {
	name: 'Checking npm scripts in the project...',
	excerpt: `Checking your ${ chalk.yellow( 'package.json' ) } for ${ chalk.yellow( 'npm build' ) } and ${ chalk.yellow( 'npm start' ) }`,
	description: 'In VIP Go, we want each application to have an npm build and npm start scripts',
	run: () => {
		// Do work and return result
	}
}