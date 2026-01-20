import express, { Request, Response } from 'express';
import mongoose from 'mongoose';

const router = express.Router();

router.get('/health', (req: Request, res: Response) => {
  const uptime = process.uptime();
  const memoryUsage = process.memoryUsage();
  const dbStatus = mongoose.connection.readyState;

  res.status(200).json({
    uptime,
    memoryUsage,
    dbStatus: dbStatus === 1 ? 'connected' : 'disconnected',
  });
});

export default router;
