# VIP Go - Preflight Checks for Node Apps

This package runs preflight checks on your repo

## Usage

In the root of your repo, run:

```
npx @automattic/vip-go-preflight-checks
```

## Steps

### 1. `npm` scripts

In VIP Go, every time you push a new change, we run the following commands: `npm install`, `npm run build`, and `npm start`. This step checks that your `package.json` have these commands in order to build and start your application correctly.

**Note:** Some packages like `create-react-app` use `npm start` to start a dev server and `npm serve` to start a production server. You'll get a warning if we detect a `serve` script in your `package.json`.

### 2. `@automattic/vip-go` package usage

Our helper libraries living in [`@automattic/vip-go`](https://github.com/Automattic/vip-go-node) will help you integrate easily with VIP Go. Especially the `server` helper which exposes some critical routes used internally for health checking. This step checks `@automattic/vip-go` is used in your production dependencies.

### 3. Checking `PORT` and `/cache-healthcheck?` route

In VIP Go, the `PORT` in which your application will start isn't fixed and shouldn't be hardcoded. Instead, we pass an environment variable called `PORT` to your application to indicate in which port it should start. This step install dependencies, build your app, and start it on a random `PORT`. It also checks the `/cache-healthcheck?` route we use internally for health checking, and verify it responding with a `200` HTTP status code. If you're using the `@automattic/vip-go` this is added automatically for you.