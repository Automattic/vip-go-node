function getConnectionInfo() {
	const credentials = {
			user: process.env.DB_USER,
			password: process.env.DB_PASS,
			database: process.env.DB_NAME,
	};

	const writeHostsString = process.env.DB_WRITE_HOSTS || '';
	const readHostsString = process.env.DB_READ_HOSTS || '';

	const writeConnections = getDbConnectionsFromHostsString( writeHostsString, credentials );
	const readConnections = getDbConnectionsFromHostsString( readHostsString, credentials );

	const connections = {
		write: writeConnections,
		read: readConnections,
	};

	return connections;
}

function getDBConnectionsFromHostsString( hostsString, credentials ) {
	// hostsString is a CSV of `host:port` for each available db container
	const hosts = hostsString.split( ',' );

	const connections = [];

	hosts.forEach( host => {
		if ( ! host ) {
			return;
		}

		const [ hostname, port ] = host.split( ':' );

		const connection = Object.assign( {
			host: hostname,
			port: port,
		}, credentials );

		connections.push( connection );
	} );

	return connections;
}

module.exports.getConnectionInfo = getConnectionInfo;
