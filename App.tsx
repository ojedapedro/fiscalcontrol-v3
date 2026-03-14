import React, { useState, useEffect } from 'react';
import { LayoutDashboard, FileText, Settings, X, LogOut, History, UserCircle, Loader2 } from 'lucide-react';
import PaymentForm from './components/PaymentForm';
import Dashboard from './components/Dashboard';
import PaymentHistory from './components/PaymentHistory';
import Login from './components/Login';
import { PaymentRecord, User } from './types';
import { auth, db } from './firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { subscribeToPayments } from './services/firebaseService';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'form' | 'dashboard' | 'history'>('dashboard');
  const [records, setRecords] = useState<PaymentRecord[]>([]);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        if (userDoc.exists()) {
          setUser(userDoc.data() as User);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (user) {
      const unsubscribePayments = subscribeToPayments((data) => {
        setRecords(data);
      });
      return () => unsubscribePayments();
    }
  }, [user]);

  const handleLogout = async () => {
    await signOut(auth);
    setUser(null);
    setRecords([]);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#1e3a8a] animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Login onLogin={setUser} />;
  }

  // Permission Logic
  const canRegister = ['admin', 'payer'].includes(user.role);
  const canViewHistory = ['admin', 'payer', 'viewer'].includes(user.role);
  const canViewDashboard = ['admin', 'payer', 'viewer'].includes(user.role);

  return (
    <div className="min-h-screen bg-gray-100 text-gray-800 pb-12">
      {/* Navigation Bar */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <span className="text-xl font-bold text-[#1e3a8a] mr-8">FiscalControl</span>
              
              <div className="hidden md:flex space-x-2">
                {canViewDashboard && (
                  <button
                    onClick={() => setActiveTab('dashboard')}
                    className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition ${
                      activeTab === 'dashboard' 
                        ? 'text-[#1e3a8a] bg-blue-50' 
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <LayoutDashboard className="w-4 h-4 mr-2" />
                    Dashboard
                  </button>
                )}
                
                {canRegister && (
                  <button
                    onClick={() => setActiveTab('form')}
                    className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition ${
                      activeTab === 'form' 
                        ? 'text-[#1e3a8a] bg-blue-50' 
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Registrar Pago
                  </button>
                )}

                {canViewHistory && (
                  <button
                    onClick={() => setActiveTab('history')}
                    className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition ${
                      activeTab === 'history' 
                        ? 'text-[#1e3a8a] bg-blue-50' 
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <History className="w-4 h-4 mr-2" />
                    Historial y Auditoría
                  </button>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-4">
               <div className="flex items-center text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                  <UserCircle className="w-4 h-4 mr-2" />
                  <span className="font-medium mr-1">{user.name}</span>
                  <span className="text-xs bg-gray-200 px-1 rounded uppercase">({user.role})</span>
               </div>
              
              <button
                onClick={handleLogout}
                className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded"
                title="Cerrar Sesión"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {activeTab === 'form' && canRegister && (
          <PaymentForm onAddRecord={() => {}} />
        )}
        
        {activeTab === 'dashboard' && canViewDashboard && (
          <Dashboard records={records} />
        )}

        {activeTab === 'history' && canViewHistory && (
          <PaymentHistory 
            records={records} 
            user={user} 
          />
        )}
      </main>
    </div>
  );
}

export default App;
