import { PaymentRecord, PaymentStatus } from '../types';

// Helper to make the request
const makeRequest = async (url: string, payload: any) => {
  try {
    const response = await fetch(url, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    const json = await response.json();
    return json;
  } catch (error) {
    console.error("API Call Error:", error);
    return null;
  }
};

export const saveToSheet = async (record: PaymentRecord, scriptUrl: string): Promise<boolean> => {
  if (!scriptUrl) return true; // Offline mode
  
  try {
    await fetch(scriptUrl, {
      method: 'POST',
      body: JSON.stringify({ action: 'create', data: record }),
      headers: { 'Content-Type': 'text/plain;charset=utf-8' }, 
    });
    return true;
  } catch (e) {
    console.error(e);
    return false;
  }
};

export const updatePaymentStatus = async (id: string, status: PaymentStatus, scriptUrl: string): Promise<boolean> => {
  if (!scriptUrl) return true;

  try {
    await fetch(scriptUrl, {
      method: 'POST',
      body: JSON.stringify({ 
        action: 'update', 
        data: { id, status } 
      }),
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    });
    return true;
  } catch (e) {
    console.error("Error updating status:", e);
    return false;
  }
};

export const fetchPayments = async (scriptUrl: string): Promise<PaymentRecord[]> => {
  if (!scriptUrl) return [];

  try {
    const response = await fetch(scriptUrl, {
      method: 'POST',
      body: JSON.stringify({ action: 'read' }),
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    });
    
    const result = await response.json();
    if (result.result === 'success') {
      return result.data.map((item: any) => ({
        ...item,
        // Ensure dates are strings for the UI
        dateRegistered: new Date(item.dateRegistered).toISOString().split('T')[0],
        paymentDateReal: new Date(item.paymentDateReal).toISOString().split('T')[0],
      }));
    }
    return [];
  } catch (e) {
    console.warn("Could not fetch from cloud. Using local state.");
    return [];
  }
};