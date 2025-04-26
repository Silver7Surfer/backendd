export const paymentTemplates = {
    /**
     * Generate HTML template for payment notifications
     * @param {Object} invoiceDetails - The invoice details from BTCPay
     * @param {String} eventType - Type of event (InvoiceSettled, InvoiceReceivedPayment)
     * @returns {String} HTML email template
     */
    notification: (invoiceDetails, eventType) => {
      const status = eventType === 'InvoiceSettled' ? 'Settled' : 
                    (eventType === 'InvoiceReceivedPayment' ? 'Payment Received' : 'Processing');
      
      return `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 5px;">
          <h2 style="color: #333; border-bottom: 1px solid #eee; padding-bottom: 10px;">Payment Notification</h2>
          
          <div style="margin: 20px 0;">
            <p style="margin: 10px 0;"><strong>Status:</strong> <span style="color: ${status === 'Settled' ? '#28a745' : '#ffc107'}">${status}</span></p>
            <p style="margin: 10px 0;"><strong>Invoice ID:</strong> ${invoiceDetails.id}</p>
            <p style="margin: 10px 0;"><strong>Amount:</strong> ${invoiceDetails.amount} ${invoiceDetails.currency}</p>
            <p style="margin: 10px 0;"><strong>Received On:</strong> ${new Date().toLocaleString()}</p>
            ${invoiceDetails.metadata?.buyerEmail ? `<p style="margin: 10px 0;"><strong>Customer Email:</strong> ${invoiceDetails.metadata.buyerEmail}</p>` : ''}
            ${invoiceDetails.metadata?.orderId ? `<p style="margin: 10px 0;"><strong>Order ID:</strong> ${invoiceDetails.metadata.orderId}</p>` : ''}
          </div>
          
          <div style="margin-top: 30px; padding-top: 15px; border-top: 1px solid #eee;">
            <p>View invoice details in your <a href="${process.env.SERVER_URL}/stores/${process.env.BTCPAY_STORE_ID}/invoices/${invoiceDetails.id}" style="color: #0066cc; text-decoration: none;">BTCPay Server dashboard</a>.</p>
          </div>
          
          <div style="margin-top: 30px; font-size: 12px; color: #666; text-align: center;">
            <p>This is an automated notification from your payment system.</p>
          </div>
        </div>
      `;
    },
  
    /**
     * Generate HTML template for failed payments
     * @param {Object} invoiceDetails - The invoice details from BTCPay
     * @param {String} reason - Reason for failure (Expired, Invalid, etc.)
     * @returns {String} HTML email template
     */
    failed: (invoiceDetails, reason) => {
      return `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 5px;">
          <h2 style="color: #dc3545; border-bottom: 1px solid #eee; padding-bottom: 10px;">Payment Failed</h2>
          
          <div style="margin: 20px 0;">
            <p style="margin: 10px 0;"><strong>Status:</strong> <span style="color: #dc3545">Failed/${reason}</span></p>
            <p style="margin: 10px 0;"><strong>Invoice ID:</strong> ${invoiceDetails.id}</p>
            <p style="margin: 10px 0;"><strong>Amount:</strong> ${invoiceDetails.amount} ${invoiceDetails.currency}</p>
            <p style="margin: 10px 0;"><strong>Time:</strong> ${new Date().toLocaleString()}</p>
            ${invoiceDetails.metadata?.buyerEmail ? `<p style="margin: 10px 0;"><strong>Customer Email:</strong> ${invoiceDetails.metadata.buyerEmail}</p>` : ''}
            ${invoiceDetails.metadata?.orderId ? `<p style="margin: 10px 0;"><strong>Order ID:</strong> ${invoiceDetails.metadata.orderId}</p>` : ''}
          </div>
          
          <div style="margin-top: 30px; padding-top: 15px; border-top: 1px solid #eee;">
            <p>View invoice details in your <a href="${process.env.SERVER_URL}/stores/${process.env.BTCPAY_STORE_ID}/invoices/${invoiceDetails.id}" style="color: #0066cc; text-decoration: none;">BTCPay Server dashboard</a>.</p>
          </div>
        </div>
      `;
    },
  
    /**
     * Generate HTML template for customer receipt
     * @param {Object} invoiceDetails - The invoice details from BTCPay
     * @returns {String} HTML email template
     */
    customerReceipt: (invoiceDetails) => {
      return `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 5px;">
          <h2 style="color: #28a745; border-bottom: 1px solid #eee; padding-bottom: 10px;">Payment Confirmation</h2>
          
          <div style="margin: 20px 0;">
            <p style="margin: 10px 0;">Thank you for your payment. We have received your payment and it has been processed successfully.</p>
            
            <h3 style="margin-top: 20px;">Payment Details</h3>
            <p style="margin: 10px 0;"><strong>Amount:</strong> ${invoiceDetails.amount} ${invoiceDetails.currency}</p>
            <p style="margin: 10px 0;"><strong>Invoice ID:</strong> ${invoiceDetails.id}</p>
            <p style="margin: 10px 0;"><strong>Date:</strong> ${new Date().toLocaleString()}</p>
            ${invoiceDetails.metadata?.itemDesc ? `<p style="margin: 10px 0;"><strong>Item:</strong> ${invoiceDetails.metadata.itemDesc}</p>` : ''}
          </div>
          
          <div style="margin-top: 30px; padding-top: 15px; border-top: 1px solid #eee; text-align: center;">
            <p>If you have any questions, please contact our support team.</p>
          </div>
        </div>
      `;
    }
  };