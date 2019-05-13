import check from '../src/checks/00-npm-scripts';
import defaultValues from '../__mocks__/package';

describe( 'preflight-checks/00-npm-scripts', () => {
	let packageJson;

	beforeEach( () => {
		// Using JSON.parse & JSON.stringify to copy nested objects
		// Object.assign do not copy nested objects
		packageJson = JSON.parse( JSON.stringify( defaultValues ) );
	} );

	describe( 'Should fail', () => {
		it( 'if there is no start script', async () => {
			const result = await check.run( packageJson );
			expect( result ).toBe( 'failed' );
		} );

		it( 'if there is no build script', async () => {
			packageJson.scripts.start = 'cats';

			const result = await check.run( packageJson );
			expect( result ).toBe( 'failed' );
		} );
	} );

	describe( 'Should raise warning', () => {
		it( 'if there is a serve script', async () => {
			// this is for CRA apps
			packageJson.scripts.start = 'cats';
			packageJson.scripts.build = 'dogs';
			packageJson.scripts.serve = 'dogs & cats';

			const result = await check.run( packageJson );
			expect( result ).toBe( 'warning' );
		} );
	} );

	describe( 'Should pass', () => {
		it( 'if there is a start and build script', async () => {
			packageJson.scripts.start = 'cats';
			packageJson.scripts.build = 'dogs';

			const result = await check.run( packageJson );
			expect( result ).toBe( 'success' );
		} );
	} );
} );