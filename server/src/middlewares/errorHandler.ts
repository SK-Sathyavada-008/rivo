import { Request, Response, NextFunction } from 'express';
import { captureException } from '../config/sentry.js';

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Capture in Sentry if configured
  captureException(err, { path: req.path, method: req.method });

  const statusCode = err.status || err.statusCode || 500;
  const message = err.message || 'An unexpected internal server error occurred';

  // Handle Mongoose duplicate key errors
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    res.status(409).json({
      error: `Duplicate entry error: A record with this ${field} already exists.`,
      field,
    });
    return;
  }

  // Handle Mongoose validation errors
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors || {}).map((e: any) => e.message);
    res.status(400).json({
      error: 'Validation failed',
      details: errors,
    });
    return;
  }

  res.status(statusCode).json({
    error: message,
    details: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
}
