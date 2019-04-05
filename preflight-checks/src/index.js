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
console.log();

const results = checks.map( check => {
	console.log( check.name );
	console.log( check.excerpt );
	return check.run();
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