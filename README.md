# Anvil Testcontainers Module Node.js

## Testcontainers Module

This repository also provides a [Testcontainers](https://testcontainers.com/) module for Node.js to run a customized
Anvil node in
your E2E tests.

**Base image:** https://github.com/foundry-rs/foundry/blob/master/Dockerfile

**Built using Anvil:** https://getfoundry.sh/anvil/reference/anvil

**Testcontainer image:** https://hub.docker.com/repository/docker/hellaweb3/0.1-eth-anvil/general

**Current image:** `hellaweb3/foundry-anvil:1.6`

----

### Local Testing

**Build the docker image:**

```shell
docker build -t hellaweb3/foundry-anvil:1.6 .
```

**Run the docker image:**

```shell
docker run -p 8545:8545 hellaweb3/foundry-anvil:1.6
```

**Push the docker image:**

```shell
docker push hellaweb3/foundry-anvil:1.6
```

**Use cast to test the connection:**

```shell
cast block-number
```

**Use script to test the connection:**

```shell
node ./scripts/get-block-number.ts
```

----

## Quick Start

```bash
# Install dependencies
bun install

# Start development mode
bun run dev

# Build for production
bun run build

# Run tests
bun run test

# Lint code
bun run lint

# Format code
bun run format
```

----

## Scripts

| Script                 | Description                       |
|------------------------|-----------------------------------|
| `bun run dev`          | Start development mode with watch |
| `bun run build`        | Build for production              |
| `bun run test`         | Run tests                         |
| `bun run test:watch`   | Run tests in watch mode           |
| `bun run lint`         | Lint code                         |
| `bun run format`       | Format code                       |
| `bun run format:check` | Check if code is formatted        |
| `bun run typecheck`    | Run TypeScript type checking      |

----

### Forking

Configure the Anvil node to fork from a remote RPC URL:

```ts
const container = await new AnvilContainer()
    .withForkUrl("https://eth-mainnet.g.alchemy.com/v2/your-api-key")
    .withForkBlockNumber(17500000)
    .start();
```

----

## Tools

TSDX wraps these modern, high-performance tools:

- **[Bunchee](https://github.com/huozhi/bunchee)** - Zero-config bundler for npm packages
- **[Vitest](https://vitest.dev/)** - Next-generation testing framework
- **[Oxlint](https://oxc.rs/docs/guide/usage/linter.html)** - Rust-powered linter (50-100x faster than ESLint)
- **[Oxfmt](https://oxc.rs/docs/guide/usage/formatter)** - Rust-powered formatter (35x faster than Prettier)
- **[TypeScript](https://www.typescriptlang.org/)** - Type safety

## Module Formats

This library exports both ESM and CommonJS formats, with full TypeScript support:

- `dist/index.js` - ESM
- `dist/index.cjs` - CommonJS
- `dist/index.d.ts` - TypeScript declarations

## Publishing

```bash
# Build the package
bun run build

# Publish to npm
npm publish
```

We recommend using [np](https://github.com/sindresorhus/np) for publishing.

----

## Contracts

WETH: https://etherscan.io/address/0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2#code

## License

MIT
