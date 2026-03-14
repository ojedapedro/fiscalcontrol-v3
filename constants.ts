import { PaymentType } from './types';

export const PAYMENT_TYPES = [
  PaymentType.FISCAL,
  PaymentType.PARAFISCAL,
  PaymentType.SERVICIO,
  PaymentType.MUNICIPAL,
  PaymentType.OTRO
];

export const INITIAL_FORM_STATE = {
  dateRegistered: new Date().toISOString().split('T')[0],
  organism: '',
  paymentType: PaymentType.FISCAL,
  amount: 0,
  paymentDateReal: new Date().toISOString().split('T')[0],
  unitCode: '',
  unitName: '',
  municipality: '',
  description: '',
  contactPhone: ''
};

// This is a placeholder. The user should input their own via the UI.
export const DEFAULT_SCRIPT_URL = '';