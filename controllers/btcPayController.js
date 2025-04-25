// controllers/btcpayController.js
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const btcpayUrl = process.env.SERVER_URL;
const apiKey = process.env.BTCPAY_API_KEY;
const storeId = process.env.BTCPAY_STORE_ID;

export const createInvoice = async (req, res) => {
  try {
    const { amount, currency = 'USD', productId, title, customerEmail, redirectUrl, description } = req.body;
    
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Valid amount is required' });
    }
    
    // Format the current timestamp for BTCPay
    const now = new Date();
    const expiryTime = new Date(now.getTime() + 15 * 60000); // 15 minutes from now
    
    // Create invoice payload
    const invoiceData = {
      amount: amount.toString(),
      currency: currency,
      metadata: {
        orderId: `order-${productId || Date.now()}`,
        buyerEmail: customerEmail || undefined,
        
        // The magic structure for POS-style receipt
        itemCode: productId || 'product',
        itemDesc: title || productId || 'Product Purchase',
        posDataaa: {
          Gameid: title || productId || 'Product Purchase',
          Description: description || `Payment for product: ${productId || 'Item'}`
        }
      },
      checkout: {
        redirectURL: redirectUrl || process.env.CLIENT_URL || 'http://localhost:5173',
        defaultPaymentMethod: 'BTC'
      },
      description: description || `Payment for product: ${productId || 'Item'}`,
      expiryTime: expiryTime.toISOString()
    };
    

    console.log('Creating invoice with data:', invoiceData);
    
    // Make request to BTCPay Server API using the Greenfield API key
    const response = await axios.post(`${btcpayUrl}/api/v1/stores/${storeId}/invoices`, 
      invoiceData,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `token ${apiKey}`
        }
      }
    );
    
    console.log('Invoice created:', response.data.id);
    
    // Return payment details to frontend
    res.json({
      invoiceId: response.data.id,
      paymentUrl: response.data.checkoutLink,
      status: response.data.status,
      expirationTime: response.data.expirationTime
    });
  } catch (error) {
    console.error('Error creating invoice:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to create invoice', details: error.response?.data || error.message });
  }
};

// Get invoice status
export const getInvoiceStatus = async (req, res) => {
  try {
    const { invoiceId } = req.params;
    
    const response = await axios.get(
      `${btcpayUrl}/api/v1/stores/${storeId}/invoices/${invoiceId}`,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `token ${apiKey}`
        }
      }
    );
    
    const invoice = response.data;
    
    res.json({
      invoiceId: invoice.id,
      status: invoice.status,
      paymentReceived: invoice.status === 'Settled' || invoice.status === 'Processing',
      paymentCompleted: invoice.status === 'Settled'
    });
  } catch (error) {
    console.error('Error fetching invoice:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to fetch invoice' });
  }
};

// Handle webhook notifications
export const handleWebhook = async (req, res) => {
  try {
    const event = req.body;
    
    // Log the incoming webhook data
    console.log('Received BTCPay webhook:', event);
    
    // Process different event types
    if (event.type === 'InvoiceSettled') {
      // Payment confirmed, update your database
      console.log(`Payment settled for invoice ${event.invoiceId}`);
      // Update order status in your database
    } else if (event.type === 'InvoiceExpired') {
      // Handle expired invoice
      console.log(`Invoice expired: ${event.invoiceId}`);
    } else if (event.type === 'InvoicePaymentSettled') {
      // Handle payment settlement
      console.log(`Payment settled: ${event.invoiceId}`);
    } else {
      console.log(`Unhandled event type: ${event.type}`);
    }
    
    // Always respond with 200 OK to acknowledge receipt
    res.sendStatus(200);
  } catch (error) {
    console.error('Error processing webhook:', error);
    // Still return 200 to prevent BTCPay from retrying
    res.sendStatus(200);
  }
};