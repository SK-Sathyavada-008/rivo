import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from server or root
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config();

export const ENV = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '5000', 10),
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/rivo',
  JWT_SECRET: process.env.JWT_SECRET || 'rivo_dev_fallback_secret_change_in_production',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',
  SENTRY_DSN: process.env.SENTRY_DSN || '',
  GEMMA_API_URL: process.env.GEMMA_API_URL || '',
  GEMMA_API_KEY: process.env.GEMMA_API_KEY || '',
  GEMMA_MODEL: process.env.GEMMA_MODEL || 'gemma-2-9b-it',
  UPLOAD_DIR: path.resolve(__dirname, '../../uploads'),
};
