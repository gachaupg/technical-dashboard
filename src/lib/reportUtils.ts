import { Order, OrderItem } from '@/contexts/ProductContext';

/**
 * Generates a CSV string from an array of ordered products
 */
export const generateOrderCSV = (order: Order): string => {
  // CSV Header row
  const header = ['Product ID', 'Product Name', 'Quantity', 'Price Per Unit', 'Total Price'];
  
  // CSV Data rows
  const rows = order.items.map((item: OrderItem) => [
    item.productId,
    item.title,
    item.quantity,
    item.price.toFixed(2),
    (item.price * item.quantity).toFixed(2)
  ]);
  
  // Add a summary row
  rows.push(['', '', '', 'Total:', order.total.toFixed(2)]);
  
  // Combine all rows into a CSV string
  return [
    header.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');
};

/**
 * Triggers a download of the CSV file
 */
export const downloadOrderReport = (order: Order): void => {
  const csv = generateOrderCSV(order);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  // Create a temporary link and trigger download
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `order-${order.id}-${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  
  // Clean up
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Generates an HTML template for order reports
 */
export const generateOrderHTML = (order: Order): string => {
  const date = new Date(order.date).toLocaleString();
  
  // Create the HTML content
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Order #${order.id}</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 0;
          padding: 20px;
          color: #333;
        }
        .report {
          max-width: 800px;
          margin: 0 auto;
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
        }
        .header h1 {
          margin-bottom: 5px;
        }
        .customer-info {
          margin-bottom: 20px;
          padding: 15px;
          background-color: #f9f9f9;
          border-radius: 5px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
        }
        th, td {
          padding: 10px;
          text-align: left;
          border-bottom: 1px solid #ddd;
        }
        th {
          background-color: #f2f2f2;
        }
        .total-row {
          font-weight: bold;
        }
        .footer {
          margin-top: 30px;
          text-align: center;
          font-size: 12px;
          color: #666;
        }
      </style>
    </head>
    <body>
      <div class="report">
        <div class="header">
          <h1>Order Receipt</h1>
          <p>Order ID: ${order.id}</p>
          <p>Date: ${date}</p>
          <p>Status: ${order.status}</p>
        </div>
        
        <div class="customer-info">
          <p><strong>Customer:</strong> ${order.customerName}</p>
          <p><strong>Email:</strong> ${order.customerEmail}</p>
          ${order.customerPhone ? `<p><strong>Phone:</strong> ${order.customerPhone}</p>` : ''}
          ${order.address ? `<p><strong>Address:</strong> 
            ${order.address.line1 || ''} 
            ${order.address.line2 ? order.address.line2 : ''} 
            ${order.address.city || ''} 
            ${order.address.state || ''} 
            ${order.address.postalCode || ''} 
            ${order.address.country || ''}
          </p>` : ''}
        </div>
        
        <table>
          <thead>
            <tr>
              <th>Product</th>
              <th>Quantity</th>
              <th>Price</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            ${order.items.map(item => `
              <tr>
                <td>${item.title}</td>
                <td>${item.quantity}</td>
                <td>$${item.price.toFixed(2)}</td>
                <td>$${(item.price * item.quantity).toFixed(2)}</td>
              </tr>
            `).join('')}
            <tr class="total-row">
              <td colspan="3" style="text-align: right;">Total:</td>
              <td>$${order.total.toFixed(2)}</td>
            </tr>
          </tbody>
        </table>
        
        <div class="footer">
          <p>Thank you for your purchase!</p>
          <p>ProductVista</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

/**
 * Generates and downloads an HTML report for an order
 */
export const downloadOrderHTMLReport = (order: Order): void => {
  const html = generateOrderHTML(order);
  const blob = new Blob([html], { type: 'text/html;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  // Create a temporary link and trigger download
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `order-${order.id}-${new Date().toISOString().slice(0, 10)}.html`);
  document.body.appendChild(link);
  link.click();
  
  // Clean up
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}; 