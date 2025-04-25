import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import btcpayRoutes from './routes/btcpayRoutes.js';

dotenv.config();

const app = express();
app.use(express.json());

app.use('/api', btcpayRoutes);

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});