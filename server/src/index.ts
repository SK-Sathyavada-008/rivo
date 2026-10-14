import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

import { ENV } from './config/env.js';
import { connectDB } from './config/db.js';
import { initSentry } from './config/sentry.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { apiRateLimiter } from './middlewares/rateLimiter.js';

// Route imports
import authRoutes from './routes/authRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import studentRoutes from './routes/studentRoutes.js';
import ledgerRoutes from './routes/ledgerRoutes.js';
import evidenceRoutes from './routes/evidenceRoutes.js';
import transactionRoutes from './routes/transactionRoutes.js';
import allocationRoutes from './routes/allocationRoutes.js';
import exceptionRoutes from './routes/exceptionRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import auditRoutes from './routes/auditRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// 1. Sentry Telemetry (Graceful)
initSentry(app);

// 2. Security Headers & CORS
app.use(
  helmet({
    contentSecurityPolicy: false, // Let React app load its styles & fonts cleanly
  })
);

app.use(
  cors({
    origin: [ENV.CLIENT_URL, 'http://localhost:5173', 'http://localhost:3000'],
    credentials: true,
  })
);

// 3. Parsers & Logger
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
app.use(morgan(ENV.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Static uploads directory
if (!fs.existsSync(ENV.UPLOAD_DIR)) {
  fs.mkdirSync(ENV.UPLOAD_DIR, { recursive: true });
}
app.use('/uploads', express.static(ENV.UPLOAD_DIR));

// 4. Rate Limiting on API
app.use('/api', apiRateLimiter);

// 5. Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    app: 'Rivo - Fee Reconciliation Platform',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    env: ENV.NODE_ENV,
  });
});

// 6. Mount API Routes
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api', studentRoutes); // /students, /batches, /families
app.use('/api/ledger', ledgerRoutes);
app.use('/api/evidence', evidenceRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/allocations', allocationRoutes);
app.use('/api/exceptions', exceptionRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/audit-logs', auditRoutes);

// 7. Production Frontend Static Serving
const clientDistPath = path.resolve(__dirname, '../../client/dist');
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
      return next();
    }
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

// 8. Global Error Handler
app.use(errorHandler);

// 9. Start Server
async function startServer() {
  try {
    await connectDB();
    const server = app.listen(ENV.PORT, () => {
      console.log(`===============================================`);
      console.log(` RIVO SERVER RUNNING ON PORT ${ENV.PORT}`);
      console.log(` Environment: ${ENV.NODE_ENV}`);
      console.log(` Health check: http://localhost:${ENV.PORT}/api/health`);
      console.log(`===============================================`);
    });
    return server;
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Only auto-start if not running tests
if (process.env.NODE_ENV !== 'test') {
  startServer();
}

export { app, startServer };
