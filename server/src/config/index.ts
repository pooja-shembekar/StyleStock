import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env'), override: false });

const config = {
  nodeEnv: process.env.NODE_ENV,
  port: Number(process.env.PORT ?? 5000),
  database_url: process.env.DATABASE_URL,
  jwt_secret: process.env.JWT_SECRET,
  client_url: process.env.CLIENT_URL,
  cors_origins: process.env.CORS_ORIGINS
};

type ValidatedRuntimeConfig = typeof config & {
  nodeEnv: string;
  database_url: string;
  jwt_secret: string;
};

export class RuntimeConfigError extends Error {
  readonly missingEnvironmentVariables: string[];

  constructor(
    message: string,
    missingEnvironmentVariables: string[] = []
  ) {
    super(message);
    this.name = 'RuntimeConfigError';
    this.missingEnvironmentVariables = missingEnvironmentVariables;
  }
}

function isValidDatabaseUrl(value: string): boolean {
  return /^mongodb(?:\+srv)?:\/\/[^/?#\s]+(?:[/?#]|$)/i.test(value);
}

export function assertRuntimeConfig(): ValidatedRuntimeConfig {
  const missing = [
    !config.database_url?.trim() && 'DATABASE_URL',
    !config.jwt_secret?.trim() && 'JWT_SECRET',
    !config.nodeEnv?.trim() && 'NODE_ENV'
  ].filter((name): name is string => Boolean(name));

  if (missing.length) {
    throw new RuntimeConfigError(
      `Missing required environment variables: ${missing.join(', ')}`,
      missing
    );
  }
  if (!isValidDatabaseUrl(config.database_url!)) {
    throw new RuntimeConfigError('DATABASE_URL must be a valid MongoDB connection URI');
  }
  if (config.client_url?.trim() && !getClientOrigin()) {
    throw new RuntimeConfigError('CLIENT_URL must be a valid HTTPS origin');
  }
  if (hasInvalidCorsOrigins()) {
    throw new RuntimeConfigError('CORS_ORIGINS must contain only valid HTTPS or localhost HTTP origins');
  }
  if (!Number.isInteger(config.port) || config.port < 1 || config.port > 65535) {
    throw new RuntimeConfigError('PORT must be an integer between 1 and 65535');
  }

  return {
    ...config,
    nodeEnv: config.nodeEnv!,
    database_url: config.database_url!,
    jwt_secret: config.jwt_secret!
  };
}

export function getClientOrigin() {
  const clientUrl = config.client_url?.trim();
  if (!clientUrl) return undefined;
  try {
    const url = new URL(clientUrl);
    if (
      url.protocol !== 'https:' ||
      !url.hostname ||
      url.username ||
      url.password ||
      url.pathname !== '/' ||
      url.search ||
      url.hash
    ) return undefined;
    return url.origin;
  } catch {
    return undefined;
  }
}

function validateCorsOrigin(value: string): string | undefined {
  try {
    const url = new URL(value.trim());
    const isLocalhost = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname.toLowerCase());
    if (
      url.origin === 'null' ||
      url.username ||
      url.password ||
      url.pathname !== '/' ||
      url.search ||
      url.hash ||
      (url.protocol !== 'https:' && !(url.protocol === 'http:' && isLocalhost))
    ) return undefined;
    return url.origin;
  } catch {
    return undefined;
  }
}

function configuredCorsOrigins() {
  return (config.cors_origins ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

export function getAdditionalCorsOrigins(): string[] {
  return configuredCorsOrigins()
    .map(validateCorsOrigin)
    .filter((origin): origin is string => Boolean(origin));
}

export function hasInvalidCorsOrigins(): boolean {
  return configuredCorsOrigins().some((origin) => !validateCorsOrigin(origin));
}

export default config;
