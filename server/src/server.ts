import { Server } from 'http';
import mongoose from 'mongoose';
import app from './app';
import config, { assertRuntimeConfig, RuntimeConfigError } from './config';

let server: Server;
let mongoConnectionAttempted = false;
let serverListening = false;
let startupPhase: 'configuration' | 'database' | 'listener' = 'configuration';

function logStartupInfo(message: string): void {
  process.stdout.write(`${message}\n`);
}

function logStartupError(message: string): void {
  process.stderr.write(`${message}\n`);
}

function sanitizeStartupMessage(message: string): string {
  let sanitized = message;

  for (const secret of [config.database_url, config.jwt_secret]) {
    if (secret) sanitized = sanitized.split(secret).join('[REDACTED]');
  }

  return sanitized
    .replace(/mongodb(?:\+srv)?:\/\/[^\s"'<>]+/gi, '[REDACTED_MONGODB_URI]')
    .replace(
      /\b(password|passwd|pwd|token|secret|authorization)(\s*[=:]\s*)("[^"]*"|'[^']*'|[^\s,;]+)/gi,
      '$1$2[REDACTED]'
    );
}

function errorProperty(error: unknown, key: string): unknown {
  return error !== null && typeof error === 'object' && key in error
    ? (error as Record<string, unknown>)[key]
    : undefined;
}

function describeMongoCause(cause: unknown): string | undefined {
  if (cause === undefined || cause === null) return undefined;

  if (cause instanceof Error) {
    return sanitizeStartupMessage(`${cause.name}: ${cause.message}`);
  }

  if (typeof cause === 'object') {
    const servers = errorProperty(cause, 'servers');
    if (servers instanceof Map) {
      const serverError = Array.from(servers.values())
        .map((serverDescription) => errorProperty(serverDescription, 'error'))
        .find((error): error is Error => error instanceof Error);
      const topology = errorProperty(cause, 'type');
      const topologyDescription = typeof topology === 'string' ? `Topology ${topology}` : 'MongoDB topology';
      return sanitizeStartupMessage(
        serverError ? `${topologyDescription}; ${serverError.name}: ${serverError.message}` : topologyDescription
      );
    }

    const name = errorProperty(cause, 'name');
    const message = errorProperty(cause, 'message');
    if (typeof message === 'string') {
      return sanitizeStartupMessage(`${typeof name === 'string' ? name : 'MongoDB cause'}: ${message}`);
    }
  }

  return sanitizeStartupMessage(String(cause));
}

function describeError(error: unknown): {
  name: string;
  message: string;
  mongoCause?: string;
  missingEnvironmentVariables?: string[];
} {
  if (!(error instanceof Error)) {
    return { name: 'UnknownError', message: 'A non-Error value was thrown' };
  }

  const code = 'code' in error && (typeof error.code === 'string' || typeof error.code === 'number')
    ? ` [code ${error.code}]`
    : '';
  const cause = errorProperty(error, 'cause') ?? errorProperty(error, 'reason');
  const details: ReturnType<typeof describeError> = {
    name: sanitizeStartupMessage(error.name || 'Error'),
    message: sanitizeStartupMessage(`${error.message || '(no message)'}${code}`)
  };
  const mongoCause = describeMongoCause(cause);
  if (mongoCause) details.mongoCause = mongoCause;
  if (error instanceof RuntimeConfigError && error.missingEnvironmentVariables.length) {
    details.missingEnvironmentVariables = error.missingEnvironmentVariables;
  }
  return details;
}

async function main() {
  const runtimeConfig = assertRuntimeConfig();

  startupPhase = 'database';
  mongoConnectionAttempted = true;
  logStartupInfo('MongoDB connection attempted: yes');
  await mongoose.connect(runtimeConfig.database_url, { serverSelectionTimeoutMS: 10000 });
  logStartupInfo('MongoDB connection established.');

  startupPhase = 'listener';
  server = await new Promise<Server>((resolve, reject) => {
    const listeningServer = app.listen(config.port, '0.0.0.0');
    listeningServer.once('error', reject);
    listeningServer.once('listening', () => resolve(listeningServer));
  });
  serverListening = true;
  logStartupInfo(`HTTP server successfully started listening on port ${config.port}.`);
}

main().catch((error: unknown) => {
  const details = describeError(error);
  logStartupError(JSON.stringify({
    stage: startupPhase,
    errorName: details.name,
    message: details.message,
    ...(details.mongoCause ? { mongoCause: details.mongoCause } : {}),
    ...(details.missingEnvironmentVariables
      ? { missingEnvironmentVariables: details.missingEnvironmentVariables }
      : {}),
    mongoConnectionAttempted,
    serverListening
  }));
  process.exit(1);
});

process.on('unhandledRejection', (reason: unknown) => {
  const details = describeError(reason);
  logStartupError(`Unhandled rejection (${details.name}): ${details.message}; shutting down.`);
  if (server) {
    server.close(() => {
      process.exit(1);
    });
  }
  process.exit(1);
});

process.on('uncaughtException', (error: Error) => {
  const details = describeError(error);
  logStartupError(`Uncaught exception (${details.name}): ${details.message}; shutting down.`);
  process.exit(1);
});
