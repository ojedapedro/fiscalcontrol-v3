import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDocs, 
  query, 
  where, 
  onSnapshot,
  orderBy,
  Timestamp,
  serverTimestamp
} from 'firebase/firestore';
import { db, auth } from '../firebase';
import { PaymentRecord, PaymentStatus, User } from '../types';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export const subscribeToPayments = (callback: (records: PaymentRecord[]) => void) => {
  const q = query(collection(db, 'payments'), orderBy('dateRegistered', 'desc'));
  
  return onSnapshot(q, (snapshot) => {
    const records: PaymentRecord[] = snapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id,
    } as PaymentRecord));
    callback(records);
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, 'payments');
  });
};

export const savePaymentToFirestore = async (record: Omit<PaymentRecord, 'id'>): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, 'payments'), {
      ...record,
      createdBy: auth.currentUser?.uid,
      dateRegistered: new Date().toISOString(),
    });
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, 'payments');
    return '';
  }
};

export const updatePaymentStatusInFirestore = async (id: string, status: PaymentStatus): Promise<void> => {
  try {
    const docRef = doc(db, 'payments', id);
    await updateDoc(docRef, { status });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `payments/${id}`);
  }
};

export const deletePaymentFromFirestore = async (id: string): Promise<void> => {
  try {
    const docRef = doc(db, 'payments', id);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `payments/${id}`);
  }
};
