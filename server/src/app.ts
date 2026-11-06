import cors from 'cors';
import express, { Application } from 'express';
import mongoose from 'mongoose';
import morgan from 'morgan';
import rootRouter from './routes';
import notFound from './middlewares/notFound';
import globalErrorHandler from './middlewares/globalErrorhandler';
import config, { getClientOrigin } from './config';
import CustomError from './errors/customError';

const app: Application = express();

app.use(express.json());
app.use(morgan('dev'));

const developmentOrigins = ['http://localhost:5173', 'http://localhost:3000'];
const clientOrigin = getClientOrigin();
const allowedOrigins = [
  ...(config.nodeEnv === 'production' ? [] : developmentOrigins),
  ...(clientOrigin ? [clientOrigin] : [])
];

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }
    callback(new CustomError(403, 'Origin is not allowed by CORS'));
  }
}));

const livenessResponse = (_req: express.Request, res: express.Response) =>
  res.status(200).json({ success: true, status: 'ok' });

app.get('/', livenessResponse);
app.get('/health', livenessResponse);
app.get('/api/v1/health', async (_req, res) => {
  try {
    if (mongoose.connection.readyState !== 1 || !mongoose.connection.db) {
      return res.status(503).json({
        success: false,
        status: 'not_ready',
        database: 'disconnected'
      });
    }

    await mongoose.connection.db.admin().ping();
    return res.status(200).json({
      success: true,
      status: 'ready',
      database: 'connected'
    });
  } catch {
    return res.status(503).json({
      success: false,
      status: 'not_ready',
      database: 'disconnected'
    });
  }
});

// application routes
app.use('/api/v1', rootRouter);

app.use(globalErrorHandler);

app.use(notFound);

export default app;
