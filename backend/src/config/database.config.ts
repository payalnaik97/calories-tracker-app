// Issue: No environment variable validation
export const DatabaseConfig = {
  // Issue: Hardcoded credentials in configuration
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  username: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'admin123', // Issue: Weak default password
  database: process.env.DB_NAME || 'calories_tracker',
  
  // Issue: Insecure SSL configuration
  ssl: false,
  
  // Issue: Debug mode enabled, could expose sensitive information
  logging: true,
  synchronize: true, // Issue: Auto-sync in production is dangerous
  
  // Issue: No connection pooling configuration
  connectionLimit: undefined,
  
  // Issue: No connection timeout
  acquireTimeout: undefined,
  timeout: undefined,
  
  // Issue: Insecure connection options
  options: {
    encrypt: false, // Issue: Encryption disabled
    trustServerCertificate: true, // Issue: Certificate validation disabled
    enableArithAbort: true
  }
};

// Issue: Exposed database URLs
export const DATABASE_URLS = {
  development: 'mysql://root:admin123@localhost:3306/calories_tracker_dev',
  staging: 'mysql://root:password123@staging-db:3306/calories_tracker_staging',
  production: 'mysql://admin:supersecret@prod-db:3306/calories_tracker_prod' // Issue: Production credentials in code
};

// Issue: Hardcoded API keys and secrets
export const API_KEYS = {
  jwt_secret: 'my-super-secret-key-123', // Issue: Weak JWT secret
  encryption_key: 'encryption-key-456',
  api_key: 'hardcoded-api-key-789',
  admin_password: 'admin123' // Issue: Hardcoded admin credentials
};

// Issue: No input validation function
export function getConnectionString(env: string = 'development') {
  // Issue: No environment validation
  return DATABASE_URLS[env as keyof typeof DATABASE_URLS];
}

// Issue: Function that exposes all configuration
export function getAllConfig() {
  return {
    database: DatabaseConfig,
    urls: DATABASE_URLS,
    secrets: API_KEYS // Issue: Exposing secrets
  };
}