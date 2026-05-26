import express from 'express';
import cors from 'cors';

import authRoutes from './routes/auth.routes.js';
import documentRoutes from './routes/document.routes.js';
import chatRoutes from './routes/chat.routes.js';
import publicRoutes from './routes/public.routes.js';
import supportRequestRoutes from './routes/supportRequest.routes.js';
import { notFoundHandler, errorHandler } from './middleware/error.middleware.js';

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'supportbee-backend' });
});

app.use('/api/auth', authRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/support-requests', supportRequestRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
