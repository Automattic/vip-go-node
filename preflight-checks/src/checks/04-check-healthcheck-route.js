import chalk from 'chalk';
import fetch from 'node-fetch';

const CACHE_HEALTHCHECK_ROUTE = '/cache-healthcheck?';

const chalkPORT = chalk.yellow( 'PORT' );
const chalkHealthCheckRoute = chalk.yellow( CACHE_HEALTHCHECK_ROUTE );
const chalkVIPGo = chalk.yellow( '@automattic/vip-go' );

module.exports = {
	name: 'Testing application availability and health-check endpoint',
	excerpt: `Checking if your app accepts a ${ chalkPORT } and responds to ${ chalkHealthCheckRoute }`,
	run: async ( packageJson, { wait, verbose, port } ) => {

		const PORT = port;

		const cacheUrl = `http://localhost:${ PORT }${ CACHE_HEALTHCHECK_ROUTE }`;
		console.log( chalk.blue( '  Info:' ), `Sending a GET request to ${ cacheUrl }...` );

		try {
			const response = await fetch( cacheUrl );

			const is200 = response.status === 200;

			if ( ! is200 ) {
				throw new Error( `Could not get a ${ chalk.yellow( '200 - OK' ) } response from ${ chalkHealthCheckRoute }. ` +
					`Make sure your application accepts a ${ chalkPORT } environment variable. You can simplify this using our ${ chalkVIPGo } package.` );
			}
		} catch( error ) {
			console.log( chalk.red( '  Error:' ), error.message );
			return "failed";
		}

		return "success";
	}
}
