# VIP Go - Preflight Checks for Node Apps

This package runs preflight checks on your Node application to make sure it's ready for VIP Go.

## Usage

In the root of your repo, run:

```
npx @automattic/vip-go-preflight-checks
```

## Steps

### 1. `npm` scripts

This step checks that your `package.json` has these commands configured and can build and start your application correctly.

On VIP Go, every time you push a new change to your application, we `git pull` the latest code and then run the following commands:

- `npm install --production`;
- `npm run build`; and
- `npm start`.

If any of these commands are missing or fail, the application may not work correctly.

**Note:** Some packages like `create-react-app` use `npm start` to start a dev server and `npm serve` to start a production server. You'll get a warning if we detect a `serve` script in your `package.json`.

### 2. `@automattic/vip-go` package usage

This step checks that the `@automattic/vip-go` package is used in your production `dependencies`.

Our helper package ([`@automattic/vip-go`](https://github.com/Automattic/vip-go-node)) simplifies some of the boilerplate (e.g. the `server` helper automatically handles the route used internally for health checks) and makes it easier to integrate with platform features like logging.

### 3. Checking `PORT` and `/cache-healthcheck?` route

This step verifies that your application boots up correctly and responds to the appropriate HTTP requests.

On VIP Go, the port used by your application is dynamic and shouldn't be hardcoded. We pass it in via an environment variable called `PORT`. This step install dependencies, build your app, and starts on a random `PORT`. It also checks the `/cache-healthcheck?` route we use internally for health checking, and verifies that it responds  with a `200` HTTP status code.

If you're using the `@automattic/vip-go` this is added automatically for you.
