#!/usr/bin/env node

// Load environment variables from .env file
import dotenv from 'dotenv';
dotenv.config();

import http from 'http';
import debugLib from 'debug';
import { createApp } from '../app';
import yargs from 'yargs';
import {hideBin} from 'yargs/helpers';
import { MessageBusManager } from '../managers/MessageBusManager';

const debug = debugLib('browser-api:server');

// Parse command-line arguments
const argv = yargs(hideBin(process.argv))
    .option('port', {
        alias: 'p',
        description: 'Port to run the server on',
        type: 'number',
    })
    .help()
    .alias('help', 'h')
    .parseSync();


let port: number | string | boolean;
let server: http.Server;

async function startServer() {
    port = normalizePort(argv.port || process.env.PORT || '3000');
    const app = await createApp();
    app.set('port', port);

    server = http.createServer(app);

    // Start WebSocket message bus
    const messageBusManager = new MessageBusManager(server);

    // Expose basic connection statistics
    app.get('/api/ws/stats', (req, res) => {
      res.json(messageBusManager.getConnectionStats());
    });

    server.listen(port, () => {
        console.log(`Server running on port ${port}`);
    });
    server.on('error', onError);
    server.on('listening', onListening);
}

startServer().catch(console.error);

function normalizePort(val: string | number): number | string | boolean {
    const portNumber = typeof val === 'string' ? parseInt(val, 10) : val;

    if (isNaN(portNumber)) {
        return val;
    }

    if (portNumber >= 0) {
        return portNumber;
    }

    return false;
}

function onError(error: NodeJS.ErrnoException): void {
    if (error.syscall !== 'listen') {
        throw error;
    }

    const bind = typeof port === 'string'
        ? 'Pipe ' + port
        : 'Port ' + port;

    switch (error.code) {
        case 'EACCES':
            console.error(bind + ' requires elevated privileges');
            process.exit(1);
            break;
        case 'EADDRINUSE':
            console.error(bind + ' is already in use');
            process.exit(1);
            break;
        default:
            throw error;
    }
}

function onListening(): void {
    const addr = server.address();
    const bind = typeof addr === 'string'
        ? 'pipe ' + addr
        : 'port ' + (addr?.port || '');
    debug('Listening on ' + bind);
}

export {};