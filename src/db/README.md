# VIP Go MariaDB / MySQL Helper Library

To access the library:

``` js
const { db } = require( '@automattic/vip-go' );
const connections = db.getConnectionInfo();
```

- `connections.write` is an array of hosts with read-write access (primary).
- `connections.read` is an array of hosts with read-only access (replica).
- A connection object looks like:

```
{
  host: "127.0.0.1",
  port: "3309",
  user: "username",
  password: "password",
  database: "database",
}
```

## Configuration

On VIP Go servers, we automatically set a few env vars with connection details:

- `DB_WRITE_HOSTS`
- `DB_READ_HOSTS`
- `DB_USER`
- `DB_PASS`
- `DB_NAME`

For consistency in local environments, we recommend creating and using these variables as well.

```
DB_WRITE_HOSTS=127.0.0.1:3309
DB_READ_HOSTS=127.0.0.1:3310,127.0.0.1:3311
DB_USER=username
DB_PASS=password
DB_NAME=database
```
