# Browser API

This project is a browser API built with Express.js and TypeScript, using Bun as the runtime and build tool.

## Prerequisites

- **Node.js**: Version 18.0.0 or higher is required.
- **Bun**: Version 1.0.0 or higher is required. Bun is used for running and building the project.

## Installation

1. Ensure you have Node.js (>=18.0.0) installed on your system.

2. Install Bun:
```
curl -fsSL https://bun.sh/install | bash
```

For alternative installation methods, visit [Bun's official website](https://bun.sh).

3. Clone the repository:

```
git clone https://github.com/fulldiveVR/browser-api.git
cd browser-api
```

4. Install dependencies:

```
bun install
```

## Development

To run the project in development mode with hot reloading:

```
bun run dev
```

## Building

To build the project:

- For the current platform:
```
bun run build
```

- For macOS ARM:
```
bun run build:macos-arm
```

- For Windows:
```
bun run build:win
```

## Running in Production

To start the server in production mode:

```
bun run start
```

## Command-line Arguments

When running the built binary, you can specify the port using the `--port` argument:

```
./browser-api --port 4000
```

This will start the server on port 4000. If not specified, the server will use the default port (3000) or the port specified in the PORT environment variable.

## Dependencies

- @seald-io/nedb: ^4.0.2
- cookie-parser: ^1.4.6
- debug: ^4.3.4
- express: ^4.18.2
- http-errors: ^2.0.0
- morgan: ^1.10.0

## Dev Dependencies

- TypeScript and various @types packages for type definitions
- bun-types for Bun runtime type definitions

## License

[Your License Here]

## Contributing

[Your Contribution Guidelines Here]