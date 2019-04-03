import checks from './checks';

checks.forEach( check => {
	console.log( check.name );
	console.log( check.excerpt );
} );