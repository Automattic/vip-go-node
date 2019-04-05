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
	if ( result === 1 ) {
		const message = `[ Step ${ index + 1 }/${ checks.length } ] ${ chalk.green( 'Step successful' ) } 👍`;
		console.log( `  ${ message }` );
	}

	// Warning
	if ( result === 0 ) {
		const message = `[ Step ${ index + 1 }/${ checks.length } ] ${ chalk.yellow( 'Step finished with a warning' ) } ⚠️`;
		console.log( `  ${ message }` );
	}

	// Error: Print extra information
	if ( result === -1 ) {
		const message = `[ Step ${ index + 1 }/${ checks.length } ] ${ chalk.red( 'Step failed' ) } 😱`;
		console.log( `  ${ message }` );
		console.log( `  Failure details: ${ check.description }` );
	}

	console.log();
	console.log();

	return result;
} );

// All checks are good
const isSuccess = results.every( result => result > 0 );

if ( isSuccess ) {
	console.log( chalk.green( 'Congratulations! Your application is ready for VIP Go' ) );
	process.exit();
}

// At least a warning
const isWarning = results.every( result => result >= 0 );

if ( isWarning ) {
	console.log( chalk.yellow( 'You are close! Please manually review the warnings above' ) );
	process.exit();
}

// There was an error
console.log( chalk.red( 'Oups! Looks like you need to fix some steps to make your app ready' ) );