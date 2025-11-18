import { env } from './env.js';

if (!env.JWT_SECRET || env.JWT_SECRET === 'default-secret-key') {
  if (env.NODE_ENV === 'production') {
    console.error('❌ JWT_SECRET must be set in production!');
    process.exit(1);
  }
  console.warn('⚠️  Using default JWT_SECRET. This is insecure for production!');
}

export const JWT_SECRET = env.JWT_SECRET || 'default-secret-key';
export const JWT_EXPIRE = env.JWT_EXPIRE || '7d';



