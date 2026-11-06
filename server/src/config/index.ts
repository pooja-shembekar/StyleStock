import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const config = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT || 5000),
  database_url: process.env.DATABASE_URL,
  jwt_secret: process.env.JWT_SECRET,
  client_url: process.env.CLIENT_URL
};

export function assertRuntimeConfig() {
  const missing = [
    !config.database_url && 'DATABASE_URL',
    !config.jwt_secret && 'JWT_SECRET',
    config.nodeEnv === 'production' && !config.client_url && 'CLIENT_URL'
  ].filter((name): name is string => Boolean(name));

  if (missing.length) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
  if (config.client_url && !getClientOrigin()) {
    throw new Error('CLIENT_URL must contain only a valid frontend origin');
  }
  if (config.nodeEnv === 'production' && getClientOrigin() && !getClientOrigin()?.startsWith('https://')) {
    throw new Error('CLIENT_URL must use HTTPS in production');
  }
  if (!Number.isInteger(config.port) || config.port < 1 || config.port > 65535) {
    throw new Error('PORT must be an integer between 1 and 65535');
  }
}

export function getClientOrigin() {
  if (!config.client_url) return undefined;
  try {
    const url = new URL(config.client_url);
    if (url.username || url.password || url.pathname !== '/' || url.search || url.hash) return undefined;
    return url.origin;
  } catch {
    return undefined;
  }
}

export default config;
