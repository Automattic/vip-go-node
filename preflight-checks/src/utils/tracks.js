/**
 * External dependencies
 */

/**
 * Internal dependencies
 */
import Analytics from './tracks/analytics';
import Tracks from './tracks/analytics/clients/tracks';
let analytics = null;

async function init() {
    const tracks = new Tracks( 0, 'anon', 'vip_preflight_' );
    analytics = new Analytics( tracks );

    return analytics;
}

async function getInstance() {
    if ( analytics ) {
        return analytics;
    }

    analytics = init();

    return analytics;
}

export async function trackEvent( ...args ) {
    try {
        const client = await getInstance();
        return client.trackEvent( ...args );
    } catch ( err ) {
        console.error( 'trackEvent() failed', err );
    }
}
