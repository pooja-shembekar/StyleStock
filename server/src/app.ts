import cors from 'cors';
import express, { Application } from 'express';
import morgan from 'morgan';
import rootRouter from './routes';
import notFound from './middlewares/notFound';
import globalErrorHandler from './middlewares/globalErrorhandler';
import { getAdditionalCorsOrigins, getClientOrigin } from './config';
import CustomError from './errors/customError';

const app: Application = express();

app.use(cors({
  origin(origin, callback) {
    const allowedOrigins = [
      'http://localhost:5173',
      'http://localhost:3000',
      getClientOrigin(),
      ...getAdditionalCorsOrigins()
    ].filter((allowedOrigin): allowedOrigin is string => Boolean(allowedOrigin));
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }
    callback(new CustomError(403, 'Origin is not allowed by CORS'));
  }
}));

app.use(express.json());
app.use(morgan('dev'));

const livenessResponse = (_req: express.Request, res: express.Response) =>
  res.status(200).json({ success: true, status: 'ok' });

app.get('/', livenessResponse);
app.get('/health', livenessResponse);

// application routes
app.use('/api/v1', rootRouter);

app.use(globalErrorHandler);

app.use(notFound);

export default app;
