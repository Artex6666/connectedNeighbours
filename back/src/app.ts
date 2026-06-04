import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import swaggerUi from 'swagger-ui-express';

import { swaggerSpec } from './config/swagger';
import router from './routes';
import { errorMiddleware } from './middlewares/error.middleware';

const app: Application = express();
const allowedOrigins = process.env.FRONTEND_URL
  ?.split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

// Global middlewares — helmet has its own CORS-style header (CORP) that blocks
// images/audio loaded from the API by a different origin. We relax it for the
// static uploads directory below.
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(
  cors({
    origin: allowedOrigins?.length ? allowedOrigins : true,
  }),
);
app.use(morgan('dev'));
app.use(express.json());

// Swagger docs
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Health check
app.get('/api/v1/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// Serve uploaded media (images/audio for chat). Public URL prefix mirrors what
// the upload middleware writes inside message documents: /uploads/messages/...
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// API routes
app.use('/api/v1', router);

// Error handler (must be last)
app.use(errorMiddleware);

export default app;
