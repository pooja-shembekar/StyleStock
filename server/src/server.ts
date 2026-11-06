import { Server } from 'http';
import mongoose from 'mongoose';
import app from './app';
import config, { assertRuntimeConfig } from './config';

let server: Server;

async function main() {
  assertRuntimeConfig();
  await mongoose.connect(config.database_url as string);

  server = app.listen(config.port, '0.0.0.0', () => {
    console.log(`app is listening on port ${config.port}`);
  });
}

main().catch((error: unknown) => {
  const failureType = error instanceof Error ? error.name : 'UnknownError';
  console.error(`Application startup failed (${failureType}). Check required configuration and database availability.`);
  process.exitCode = 1;
});

process.on('unhandledRejection', () => {
  console.error('Unhandled rejection detected; shutting down.');
  if (server) {
    server.close(() => {
      process.exit(1);
    });
  }
  process.exit(1);
});

process.on('uncaughtException', () => {
  console.error('Uncaught exception detected; shutting down.');
  process.exit(1);
});
