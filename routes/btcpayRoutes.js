import express from 'express';
import { createInvoice, getInvoiceStatus, handleWebhook } from '../controllers/btcPayController.js';

const router = express.Router();

router.post('/create-invoice', createInvoice);
router.get('/invoices/:invoiceId', getInvoiceStatus);
router.post('/webhook', handleWebhook);

export default router;