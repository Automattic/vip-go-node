/**
 * External dependencies
 */

/**
 * Internal dependencies
 */
import Analytics from './tracks/analytics';
import Tracks from './tracks/analytics/clients/tracks';

const tracks = new Tracks( 0, 'anon', 'vip_preflight_' );
const client = new Analytics( tracks );

export async function trackEvent( ...args ) {
    try {
        return client.trackEvent( ...args );
    } catch ( err ) {
        console.error( 'trackEvent() failed', err );
    }
}
