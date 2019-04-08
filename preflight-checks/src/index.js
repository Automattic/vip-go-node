import chalk from 'chalk';
import checks from './checks';

console.log();
console.log( '  Welcome to' );
console.log( '   _    __________     ______' );
console.log( '  | |  / /  _/ __ \\   / ____/___' );
console.log( '  | | / // // /_/ /  / / __/ __ \\' );
console.log( '  | |/ // // ____/  / /_/ / /_/ /' );
console.log( '  |___/___/_/       \\____/\\____/' );
console.log( '  Preflight Checks for Node Apps' );
console.log();
console.log( '  Running checks for the current repository...' );
console.log();
console.log();

const results = checks.map( ( check, index ) => {
	console.log( `  [ Step ${ index + 1 }/${ checks.length } ] ${ check.name }` );
	console.log( `  [ Step ${ index + 1 }/${ checks.length } ] Step details: ${ check.excerpt }` );

	const result = check.run();

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
		console.log( `  Failure details: ${ check.description }` );
	}

	console.log();
	console.log();

	return result;
} );

const successSteps = results.filter( result => result === 'success' );
const warningSteps = results.filter( result => result === 'warning' );
const failedSteps = results.filter( result => result === 'failed' );
const skippedSteps = results.filter( result => result === 'skipped' );

const isSuccess = successSteps.length + skippedSteps.length === checks.length;
const isWarning = warningSteps.length > 0 && warningSteps.length + successSteps.length + skippedSteps.length === checks.length;
const isFailed = failedSteps.length > 0;

if ( isSuccess ) {
	console.log( chalk.green( 'Congratulations! Your application is ready for VIP Go' ) );
	process.exit();
}

if ( isWarning ) {
	console.log( chalk.yellow( 'You are close! Please manually review the warnings above' ) );
	process.exit();
}

if ( isFailed ) {
	console.log( chalk.red( 'Oups! Looks like you need to fix some steps to make your app ready' ) );
	process.exit( 1 );
}