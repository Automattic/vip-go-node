#!/usr/bin/env node
import chalk from 'chalk';
import checks from './checks';
import packageJson from './package';
import commandLineArgs from 'command-line-args';
import commandLineUsage from 'command-line-usage';

console.log();
console.log( '  Welcome to' );
console.log( '   _    __________     ______' );
console.log( '  | |  / /  _/ __ \\   / ____/___' );
console.log( '  | | / // // /_/ /  / / __/ __ \\' );
console.log( '  | |/ // // ____/  / /_/ / /_/ /' );
console.log( '  |___/___/_/       \\____/\\____/' );
console.log( '  Preflight Checks for Node Apps' );
console.log();

const optionDefinitions = [
	{ name: 'wait', alias: 'w', type: Number, defaultOption: 3000 },
	{ name: 'verbose', type: Boolean, defaultOption: false },
	{ name: 'help', alias: 'h', type: Boolean },
];

const options = commandLineArgs( optionDefinitions );

const optionsSections = [
	{
		header: 'VIP Go Node Preflight Checks',
		content: 'Run preflight checks on Node applications on VIP Go Cloud'
	},
	{
		header: 'Options',
		optionList: [
			{
				name: 'wait',
				alias: 'w',
				typeLabel: '{underline Number}',
				defaultOption: '3000',
				description: 'Configure time to wait (in milliseconds) for command to execute'
			},
			{
				name: 'verbose',
				typeLabel: '{underline Boolean}',
				defaultOption: 'false',
				description: 'Increase logging level to include app build and server boot up messages'
			},
			{
				name: 'help',
				description: 'Print this usage guide'
			}
		]
	}
];

if ( options.help ) {
	console.log( commandLineUsage( optionsSections ) );
	process.exit();
}

console.log( `  Running checks for the ${ packageJson.name } app...` );
console.log();
console.log();

let results = [];

// Using reduce to make sure we are waiting for the promise to finish before executing the next one
const result = checks.reduce( async ( priorCheck, check, index ) => {
	await priorCheck;

	console.log( `  [ Step ${ index + 1 }/${ checks.length } ] ${ check.name }` );
	console.log( `  [ Step ${ index + 1 }/${ checks.length } ] Step details: ${ check.excerpt }` );

	const currentCheck = await check.run( packageJson, options ).then( result => {
		// Success
		if ( result === 'success' ) {
			const message = `[ Step ${ index + 1 }/${ checks.length } ] ${ chalk.green( 'Step successful' ) } 👍`;
			console.log( `  ${ message }` );
		}

		// Warning
		if ( result === 'warning' ) {
			const message = `[ Step ${ index + 1 }/${ checks.length } ] ${ chalk.yellow( 'Step finished with a warning' ) } ⚠️`;
			console.log( `  ${ message }` );
		}

		// Error: Print extra information
		if ( result === 'failed' ) {
			const message = `[ Step ${ index + 1 }/${ checks.length } ] ${ chalk.red( 'Step failed' ) } 😱`;
			console.log( `  ${ message }` );
		}

		results.push( result );

		console.log();
		console.log();
	} );
	return currentCheck;
}, Promise.resolve() );

result.then( () => {
	const successSteps = results.filter( result => result === 'success' );
	const warningSteps = results.filter( result => result === 'warning' );
	const failedSteps = results.filter( result => result === 'failed' );
	const skippedSteps = results.filter( result => result === 'skipped' );

	const isSuccess = successSteps.length + skippedSteps.length === checks.length;
	const isWarning = warningSteps.length > 0 && warningSteps.length + successSteps.length + skippedSteps.length === checks.length;
	const isFailed = failedSteps.length > 0;

	if ( isSuccess ) {
		console.log( chalk.green( 'Congratulations! Your application is ready for VIP Go!' ) );
		process.exit();
	}

	if ( isWarning ) {
		console.log( chalk.yellow( 'Your application is close! Please review the warnings above to ensure best compatibility with VIP Go.' ) );
		process.exit();
	}

	if ( isFailed ) {
		console.log( chalk.red( 'Oups! Looks like you need to fix some steps to make your app ready for VIP Go.' ) );
		process.exit( 1 );
	}
} )
