import fs from 'fs';
import csv from 'csv-parser';

export interface ParsedOrder {
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  address: string;
  addressLine2?: string;
  city: string;
  postalCode: string;
  latitude?: number;
  longitude?: number;
  deliveryNotes?: string;
  orderValue?: number;
  priority?: string;
  timeWindow?: string;
}

export const parseOrdersCSV = (filePath: string): Promise<ParsedOrder[]> => {
  return new Promise((resolve, reject) => {
    const orders: ParsedOrder[] = [];

    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (row) => {
        try {
          const order: ParsedOrder = {
            orderNumber: row.orderNumber || row['Order Number'] || '',
            customerName: row.customerName || row['Customer Name'] || '',
            customerPhone: row.customerPhone || row['Phone'] || '',
            customerEmail: row.customerEmail || row['Email'] || undefined,
            address: row.address || row['Address'] || '',
            addressLine2: row.addressLine2 || row['Address Line 2'] || undefined,
            city: row.city || row['City'] || '',
            postalCode: row.postalCode || row['Postal Code'] || '',
            latitude: row.latitude ? parseFloat(row.latitude) : undefined,
            longitude: row.longitude ? parseFloat(row.longitude) : undefined,
            deliveryNotes: row.deliveryNotes || row['Notes'] || undefined,
            orderValue: row.orderValue ? parseFloat(row.orderValue) : undefined,
            priority: row.priority || row['Priority'] || 'NORMAL',
            timeWindow: row.timeWindow || row['Time Window'] || undefined,
          };

          // Basic validation
          if (order.orderNumber && order.customerName && order.address && order.city) {
            orders.push(order);
          }
        } catch (error) {
          console.error('Error parsing row:', error);
        }
      })
      .on('end', () => {
        resolve(orders);
      })
      .on('error', (error) => {
        reject(error);
      });
  });
};