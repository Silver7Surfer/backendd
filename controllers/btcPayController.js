import axios from 'axios';
import dotenv from 'dotenv';
import crypto from 'crypto';
import { sendEmail } from '../utils/emailService.js';
import { paymentTemplates } from '../templates/payment.js';

dotenv.config();

const btcpayUrl = process.env.SERVER_URL;
const apiKey = process.env.BTCPAY_API_KEY;
const storeId = process.env.BTCPAY_STORE_ID;

// Function to get invoice details from BTCPay
const getInvoiceDetails = async (invoiceId) => {
  try {
    const response = await axios.get(
      `${btcpayUrl}/api/v1/stores/${storeId}/invoices/${invoiceId}`,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `token ${apiKey}`
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching invoice details:', error);
    throw error;
  }
};

// Function to send payment notification
const sendPaymentNotification = async (invoiceId, eventType) => {
  try {
    // Get full invoice details
    const invoiceDetails = await getInvoiceDetails(invoiceId);
    
    // Generate email subject based on event type
    const subject = eventType === 'InvoiceSettled' 
      ? `Payment Settled - Invoice #${invoiceId}` 
      : `Payment Received - Invoice #${invoiceId}`;
    
    // Get HTML template
    const htmlContent = paymentTemplates.notification(invoiceDetails, eventType);
    
    // Send to admin
    await sendEmail(
      process.env.ADMIN_EMAIL,
      subject,
      htmlContent
    );
    
    // If customer email exists and is configured to send customer notifications
    if (invoiceDetails.metadata?.buyerEmail && process.env.SEND_CUSTOMER_NOTIFICATIONS === 'true') {
      const customerHtml = paymentTemplates.customerReceipt(invoiceDetails);
      await sendEmail(
        invoiceDetails.metadata.buyerEmail,
        `Your payment has been ${eventType === 'InvoiceSettled' ? 'completed' : 'received'}`,
        customerHtml
      );
    }
    
    console.log(`Email notification sent for invoice ${invoiceId}`);
    return true;
  } catch (error) {
    console.error('Failed to send payment notification email:', error);
    return false;
  }
};

// Function to send payment failed notification
const sendPaymentFailedNotification = async (invoiceId, reason) => {
  try {
    // Get full invoice details
    const invoiceDetails = await getInvoiceDetails(invoiceId);
    
    // Get HTML template
    const htmlContent = paymentTemplates.failed(invoiceDetails, reason);
    
    // Send to admin only
    await sendEmail(
      process.env.ADMIN_EMAIL,
      `Payment Failed - Invoice #${invoiceId}`,
      htmlContent
    );
    
    console.log(`Email notification sent for failed invoice ${invoiceId}`);
    return true;
  } catch (error) {
    console.error('Failed to send payment failed notification email:', error);
    return false;
  }
};

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
    // Verify the webhook signature
    const signature = req.headers['btcpay-sig'];
    const payload = JSON.stringify(req.body);
    
    if (process.env.WEBHOOK_SECRET) {
      // Compute the HMAC
      const hmac = crypto.createHmac('sha256', process.env.WEBHOOK_SECRET)
        .update(payload)
        .digest('hex');
      
      // Verify signature (format is btcpay-sig=sha256=HMAC)
      const expectedSignature = `sha256=${hmac}`;
      
      if (!signature || !signature.includes(hmac)) {
        console.error('Invalid webhook signature');
        console.error('Received:', signature);
        console.error('Expected to contain:', hmac);
        return res.status(401).send('Invalid signature');
      }
    }
    
    const event = req.body;
    
    // Log the incoming webhook data
    console.log('Received BTCPay webhook:', event);
    
    // Process different event types
    switch (event.type) {
      case 'InvoiceSettled':
      case 'InvoicePaymentSettled':
        // Payment confirmed and settled
        console.log(`Payment settled for invoice ${event.invoiceId}`);
        await sendPaymentNotification(event.invoiceId, 'InvoiceSettled');
        break;
        
      case 'InvoiceReceivedPayment':
        // Payment received but may not be settled yet
        console.log(`Payment received for invoice ${event.invoiceId}`);
        await sendPaymentNotification(event.invoiceId, 'InvoiceReceivedPayment');
        break;
        
      case 'InvoiceProcessing':
        // Invoice is processing
        console.log(`Invoice processing: ${event.invoiceId}`);
        await sendPaymentNotification(event.invoiceId, 'InvoiceProcessing');
        break;
        
      case 'InvoiceExpired':
        // Invoice expired without payment
        console.log(`Invoice expired: ${event.invoiceId}`);
        await sendPaymentFailedNotification(event.invoiceId, 'Expired');
        break;
        
      case 'InvoiceInvalid':
        // Invoice became invalid
        console.log(`Invoice invalid: ${event.invoiceId}`);
        await sendPaymentFailedNotification(event.invoiceId, 'Invalid');
        break;
        
      default:
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