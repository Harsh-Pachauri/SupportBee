import 'dotenv/config';
import { createServer } from 'node:http';
import app from './app.js';

const PORT = process.env.PORT || 5000;

createServer(app).listen(PORT, () => {
  console.log(`SupportBee backend listening on port ${PORT}`);
});
