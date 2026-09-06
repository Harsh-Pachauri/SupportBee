import express from 'express';
import cors from 'cors';

import authRoutes from './routes/auth.routes.js';
import documentRoutes from './routes/document.routes.js';
import chatRoutes from './routes/chat.routes.js';
import publicRoutes from './routes/public.routes.js';
import supportRequestRoutes from './routes/supportRequest.routes.js';
import { notFoundHandler, errorHandler } from './middleware/error.middleware.js';

// Public widget routes need wildcard CORS — the widget is embedded on arbitrary customer sites.
// Authenticated routes are restricted to the configured dashboard origin (defaults to '*' if
// CORS_ORIGIN is not set, preserving backward compatibility during development).
const widgetCors = cors({ origin: '*' });
const dashboardCors = cors({ origin: process.env.CORS_ORIGIN || '*' });

const app = express();

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'supportbee-backend' });
});

app.use('/api/auth', dashboardCors, authRoutes);
app.use('/api/documents', dashboardCors, documentRoutes);
app.use('/api/chat', dashboardCors, chatRoutes);
app.use('/api/public', widgetCors, publicRoutes);
app.use('/api/support-requests', dashboardCors, supportRequestRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
