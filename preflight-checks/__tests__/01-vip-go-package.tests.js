import check from '../src/checks/01-vip-go-package';
import defaultValues from '../__mocks__/package';

describe( 'preflight-checks/01-vip-go-package', () => {
	let packageJson;

	beforeEach( () => {
		// Using JSON.parse & JSON.stringify to copy nested objects
		// Object.assign do not copy nested objects
		packageJson = JSON.parse( JSON.stringify( defaultValues ) );
	} );

	describe( 'Should fail', () => {
		it( 'if @automattic/vip-go is not present in production dependencies', async () => {
			const result = await check.run( packageJson );
			expect( result ).toBe( 'failed' );
		} );
	} );

	describe( 'Should pass', () => {
		it( 'if @automattic/vip-go is present in production dependencies', async () => {
			packageJson.dependencies[ '@automattic/vip-go' ] = 'version';

			const result = await check.run( packageJson );
			expect( result ).toBe( 'success' );
		} );
	} );
} );