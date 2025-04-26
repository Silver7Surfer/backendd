// templates/payment.js
export const paymentTemplates = {
    /**
     * Generate HTML template for payment notifications with complete invoice data
     * @param {Object} invoiceDetails - The invoice details from BTCPay
     * @param {String} eventType - Type of event (InvoiceSettled, InvoiceReceivedPayment)
     * @returns {String} HTML email template
     */
    notification: (invoiceDetails, eventType) => {
      const status = eventType === 'InvoiceSettled' ? 'Settled' : 
                    (eventType === 'InvoiceReceivedPayment' ? 'Payment Received' : 'Processing');
      
      // Format payment methods if available
      const paymentMethodsHtml = invoiceDetails.paymentMethods ? 
        invoiceDetails.paymentMethods.map(pm => 
          `<tr>
            <td style="padding: 5px; border-bottom: 1px solid #eee;"><strong>${pm.paymentMethod}</strong></td>
            <td style="padding: 5px; border-bottom: 1px solid #eee;">${pm.amount} ${pm.cryptoCode}</td>
            <td style="padding: 5px; border-bottom: 1px solid #eee;">${pm.rate ? `Rate: ${pm.rate} ${invoiceDetails.currency}` : ''}</td>
           </tr>`
        ).join('') : '<tr><td colspan="3">No payment method details available</td></tr>';
  
      // Format payment details if available
      const paymentDetailsHtml = invoiceDetails.payments && invoiceDetails.payments.length ? 
        invoiceDetails.payments.map(payment => 
          `<tr>
            <td style="padding: 5px; border-bottom: 1px solid #eee;"><strong>${payment.id || 'N/A'}</strong></td>
            <td style="padding: 5px; border-bottom: 1px solid #eee;">${payment.value} ${payment.currency || 'BTC'}</td>
            <td style="padding: 5px; border-bottom: 1px solid #eee;">${new Date(payment.receivedDate).toLocaleString()}</td>
            <td style="padding: 5px; border-bottom: 1px solid #eee;">${payment.status || 'Unknown'}</td>
           </tr>`
        ).join('') : '<tr><td colspan="4">No payment details available</td></tr>';
      
      // Build metadata table rows if available
      let metadataRows = '';
      if (invoiceDetails.metadata) {
        for (const [key, value] of Object.entries(invoiceDetails.metadata)) {
          if (value !== undefined && value !== null) {
            metadataRows += `
              <tr>
                <td style="padding: 5px; border-bottom: 1px solid #eee;"><strong>${key}</strong></td>
                <td style="padding: 5px; border-bottom: 1px solid #eee;">
                  ${typeof value === 'object' ? JSON.stringify(value) : value}
                </td>
              </tr>
            `;
          }
        }
      }
      
      return `
        <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 5px;">
          <h2 style="color: #333; border-bottom: 1px solid #eee; padding-bottom: 10px;">Payment Notification</h2>
          
          <div style="margin: 20px 0; background-color: ${status === 'Settled' ? '#e8f5e9' : '#fff8e1'}; padding: 15px; border-radius: 4px;">
            <h3 style="margin-top: 0; color: ${status === 'Settled' ? '#2e7d32' : '#ff8f00'};">Status: ${status}</h3>
          </div>
          
          <h3 style="margin-top: 25px; color: #333;">Invoice Details</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 5px; border-bottom: 1px solid #eee;"><strong>Invoice ID</strong></td>
              <td style="padding: 5px; border-bottom: 1px solid #eee;">${invoiceDetails.id}</td>
            </tr>
            <tr>
              <td style="padding: 5px; border-bottom: 1px solid #eee;"><strong>Amount</strong></td>
              <td style="padding: 5px; border-bottom: 1px solid #eee;">${invoiceDetails.amount} ${invoiceDetails.currency}</td>
            </tr>
            <tr>
              <td style="padding: 5px; border-bottom: 1px solid #eee;"><strong>Created</strong></td>
              <td style="padding: 5px; border-bottom: 1px solid #eee;">${new Date(invoiceDetails.createdTime).toLocaleString()}</td>
            </tr>
            <tr>
              <td style="padding: 5px; border-bottom: 1px solid #eee;"><strong>Expiration</strong></td>
              <td style="padding: 5px; border-bottom: 1px solid #eee;">${new Date(invoiceDetails.expirationTime).toLocaleString()}</td>
            </tr>
            <tr>
              <td style="padding: 5px; border-bottom: 1px solid #eee;"><strong>Current Status</strong></td>
              <td style="padding: 5px; border-bottom: 1px solid #eee;">${invoiceDetails.status}</td>
            </tr>
            <tr>
              <td style="padding: 5px; border-bottom: 1px solid #eee;"><strong>Description</strong></td>
              <td style="padding: 5px; border-bottom: 1px solid #eee;">${invoiceDetails.description || 'N/A'}</td>
            </tr>
            ${invoiceDetails.additionalStatus ? `
            <tr>
              <td style="padding: 5px; border-bottom: 1px solid #eee;"><strong>Additional Status</strong></td>
              <td style="padding: 5px; border-bottom: 1px solid #eee;">${invoiceDetails.additionalStatus}</td>
            </tr>` : ''}
            ${invoiceDetails.checkoutLink ? `
            <tr>
              <td style="padding: 5px; border-bottom: 1px solid #eee;"><strong>Checkout Link</strong></td>
              <td style="padding: 5px; border-bottom: 1px solid #eee;"><a href="${invoiceDetails.checkoutLink}">${invoiceDetails.checkoutLink}</a></td>
            </tr>` : ''}
          </table>
          
          <h3 style="margin-top: 25px; color: #333;">Payment Methods</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background-color: #f5f5f5;">
                <th style="padding: 8px; text-align: left; border-bottom: 2px solid #ddd;">Method</th>
                <th style="padding: 8px; text-align: left; border-bottom: 2px solid #ddd;">Amount</th>
                <th style="padding: 8px; text-align: left; border-bottom: 2px solid #ddd;">Rate Info</th>
              </tr>
            </thead>
            <tbody>
              ${paymentMethodsHtml}
            </tbody>
          </table>
          
          <h3 style="margin-top: 25px; color: #333;">Payment Details</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background-color: #f5f5f5;">
                <th style="padding: 8px; text-align: left; border-bottom: 2px solid #ddd;">ID</th>
                <th style="padding: 8px; text-align: left; border-bottom: 2px solid #ddd;">Amount</th>
                <th style="padding: 8px; text-align: left; border-bottom: 2px solid #ddd;">Received Date</th>
                <th style="padding: 8px; text-align: left; border-bottom: 2px solid #ddd;">Status</th>
              </tr>
            </thead>
            <tbody>
              ${paymentDetailsHtml}
            </tbody>
          </table>
          
          <h3 style="margin-top: 25px; color: #333;">Metadata</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background-color: #f5f5f5;">
                <th style="padding: 8px; text-align: left; border-bottom: 2px solid #ddd;">Key</th>
                <th style="padding: 8px; text-align: left; border-bottom: 2px solid #ddd;">Value</th>
              </tr>
            </thead>
            <tbody>
              ${metadataRows || '<tr><td colspan="2">No metadata available</td></tr>'}
            </tbody>
          </table>
          
          <div style="margin-top: 30px; padding-top: 15px; border-top: 1px solid #eee;">
            <p>View complete invoice details in your <a href="${process.env.SERVER_URL}/stores/${process.env.BTCPAY_STORE_ID}/invoices/${invoiceDetails.id}" style="color: #0066cc; text-decoration: none;">BTCPay Server dashboard</a>.</p>
          </div>
          
          <div style="margin-top: 30px; font-size: 12px; color: #666; text-align: center;">
            <p>This is an automated notification from your payment system.<br>Event Type: ${eventType}<br>Time: ${new Date().toLocaleString()}</p>
          </div>
        </div>
      `;
    },
  
    /**
     * Generate HTML template for customer receipt with complete invoice data
     */
    customerReceipt: (invoiceDetails) => {
      // Format payment methods if available
      const paymentMethodsHtml = invoiceDetails.paymentMethods ? 
        invoiceDetails.paymentMethods.map(pm => 
          `<tr>
            <td style="padding: 5px; border-bottom: 1px solid #eee;"><strong>${pm.paymentMethod}</strong></td>
            <td style="padding: 5px; border-bottom: 1px solid #eee;">${pm.amount} ${pm.cryptoCode}</td>
           </tr>`
        ).join('') : '';
      
      return `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 5px;">
          <h2 style="color: #28a745; border-bottom: 1px solid #eee; padding-bottom: 10px;">Payment Confirmation</h2>
          
          <div style="margin: 20px 0; background-color: #e8f5e9; padding: 15px; border-radius: 4px;">
            <p style="margin: 0;">Thank you for your payment. We have received your payment and it has been processed successfully.</p>
          </div>
          
          <h3 style="margin-top: 25px; color: #333;">Payment Details</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 5px; border-bottom: 1px solid #eee;"><strong>Amount</strong></td>
              <td style="padding: 5px; border-bottom: 1px solid #eee;">${invoiceDetails.amount} ${invoiceDetails.currency}</td>
            </tr>
            <tr>
              <td style="padding: 5px; border-bottom: 1px solid #eee;"><strong>Invoice ID</strong></td>
              <td style="padding: 5px; border-bottom: 1px solid #eee;">${invoiceDetails.id}</td>
            </tr>
            <tr>
              <td style="padding: 5px; border-bottom: 1px solid #eee;"><strong>Date</strong></td>
              <td style="padding: 5px; border-bottom: 1px solid #eee;">${new Date().toLocaleString()}</td>
            </tr>
            <tr>
              <td style="padding: 5px; border-bottom: 1px solid #eee;"><strong>Status</strong></td>
              <td style="padding: 5px; border-bottom: 1px solid #eee;">${invoiceDetails.status}</td>
            </tr>
            ${invoiceDetails.metadata?.itemDesc ? `
            <tr>
              <td style="padding: 5px; border-bottom: 1px solid #eee;"><strong>Item</strong></td>
              <td style="padding: 5px; border-bottom: 1px solid #eee;">${invoiceDetails.metadata.itemDesc}</td>
            </tr>` : ''}
            ${invoiceDetails.description ? `
            <tr>
              <td style="padding: 5px; border-bottom: 1px solid #eee;"><strong>Description</strong></td>
              <td style="padding: 5px; border-bottom: 1px solid #eee;">${invoiceDetails.description}</td>
            </tr>` : ''}
          </table>
          
          ${paymentMethodsHtml ? `
          <h3 style="margin-top: 25px; color: #333;">Payment Method</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tbody>
              ${paymentMethodsHtml}
            </tbody>
          </table>` : ''}
          
          <div style="margin-top: 30px; padding-top: 15px; border-top: 1px solid #eee; text-align: center;">
            <p>If you have any questions, please contact our support team.</p>
          </div>
        </div>
      `;
    },
  
    /**
     * Generate HTML template for failed payments
     */
    failed: (invoiceDetails, reason) => {
      return `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 5px;">
          <h2 style="color: #dc3545; border-bottom: 1px solid #eee; padding-bottom: 10px;">Payment Failed</h2>
          
          <div style="margin: 20px 0; background-color: #f8d7da; padding: 15px; border-radius: 4px;">
            <h3 style="margin-top: 0; color: #721c24;">Status: Failed/${reason}</h3>
          </div>
          
          <h3 style="margin-top: 25px; color: #333;">Invoice Details</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 5px; border-bottom: 1px solid #eee;"><strong>Invoice ID</strong></td>
              <td style="padding: 5px; border-bottom: 1px solid #eee;">${invoiceDetails.id}</td>
            </tr>
            <tr>
              <td style="padding: 5px; border-bottom: 1px solid #eee;"><strong>Amount</strong></td>
              <td style="padding: 5px; border-bottom: 1px solid #eee;">${invoiceDetails.amount} ${invoiceDetails.currency}</td>
            </tr>
            <tr>
              <td style="padding: 5px; border-bottom: 1px solid #eee;"><strong>Created</strong></td>
              <td style="padding: 5px; border-bottom: 1px solid #eee;">${new Date(invoiceDetails.createdTime).toLocaleString()}</td>
            </tr>
            <tr>
              <td style="padding: 5px; border-bottom: 1px solid #eee;"><strong>Expired</strong></td>
              <td style="padding: 5px; border-bottom: 1px solid #eee;">${new Date(invoiceDetails.expirationTime).toLocaleString()}</td>
            </tr>
            <tr>
              <td style="padding: 5px; border-bottom: 1px solid #eee;"><strong>Time of Failure</strong></td>
              <td style="padding: 5px; border-bottom: 1px solid #eee;">${new Date().toLocaleString()}</td>
            </tr>
            ${invoiceDetails.metadata?.buyerEmail ? `
            <tr>
              <td style="padding: 5px; border-bottom: 1px solid #eee;"><strong>Customer Email</strong></td>
              <td style="padding: 5px; border-bottom: 1px solid #eee;">${invoiceDetails.metadata.buyerEmail}</td>
            </tr>` : ''}
            ${invoiceDetails.metadata?.orderId ? `
            <tr>
              <td style="padding: 5px; border-bottom: 1px solid #eee;"><strong>Order ID</strong></td>
              <td style="padding: 5px; border-bottom: 1px solid #eee;">${invoiceDetails.metadata.orderId}</td>
            </tr>` : ''}
            ${invoiceDetails.checkoutLink ? `
            <tr>
              <td style="padding: 5px; border-bottom: 1px solid #eee;"><strong>Checkout Link</strong></td>
              <td style="padding: 5px; border-bottom: 1px solid #eee;"><a href="${invoiceDetails.checkoutLink}">${invoiceDetails.checkoutLink}</a></td>
            </tr>` : ''}
          </table>
          
          <div style="margin-top: 30px; padding-top: 15px; border-top: 1px solid #eee;">
            <p>View invoice details in your <a href="${process.env.SERVER_URL}/stores/${process.env.BTCPAY_STORE_ID}/invoices/${invoiceDetails.id}" style="color: #0066cc; text-decoration: none;">BTCPay Server dashboard</a>.</p>
          </div>
        </div>
      `;
    }
  };