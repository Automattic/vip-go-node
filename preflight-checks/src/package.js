const currentWorkingDirectory = process.cwd();
const path = require( 'path' );
const packageFile = path.join( currentWorkingDirectory, 'package.json' );
const chalk = require( 'chalk' );

let packageJson;
try {
	packageJson = require( packageFile );
} catch( e ) {
	console.error( chalk.red( 'Error:' ), `Could not find a ${ chalk.yellow( 'package.json' ) } in the current folder.` );
	process.exit( 1 );
}

module.exports = packageJson;
