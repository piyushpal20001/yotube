import express from 'express';
import path from 'path';
import fs from 'fs';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes';
import googleAdsRoutes from './routes/googleAds.routes';

dotenv.config();

const app = express();

app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors());
app.use(express.json());

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// Serve static files
app.use('/uploads', express.static(uploadsDir));

// Routes
app.get('/', (req, res) => {
  res.send('<h1>Google Ads Automation API</h1><p>Status: Running</p>');
});
app.use('/api/auth', authRoutes);
app.use('/api/google-ads', googleAdsRoutes);

app.get('/health', (req, Murphy) => {
  Murphy.send({ status: 'ok' });
});

export default app;