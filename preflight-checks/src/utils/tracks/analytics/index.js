/**
 * Internal dependencies
 */
import packageJson from '../../../../package.json';
import os from 'os';

/* eslint-disable camelcase */
const client_info = {
	cli_version: packageJson.version,
	os_name: os.platform(),
	os_version: os.release(),
	node_version: process.version,
};
/* eslint-enable camelcase */

export default class Analytics {
	constructor( tracks ) {
		this.tracks = tracks;
	}

	async trackEvent( name, props = {} ){
		return Promise.all( [
			this.tracks.trackEvent( name, Object.assign( {}, client_info, props ) ),
		] );
	}
}
