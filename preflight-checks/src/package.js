const currentWorkingDirectory = process.cwd();
const path = require( 'path' );
const packageFile = path.join( currentWorkingDirectory, 'package.json' );
const packageJson = require( packageFile );

module.exports = packageJson;
