import React, { useState } from 'react';
import { User, UserRole } from '../types';
import { Shield, User as UserIcon, Eye, LogIn } from 'lucide-react';
import { auth, db } from '../firebase';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

interface LoginProps {
  onLogin: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const firebaseUser = result.user;

      // Check if user exists in Firestore
      const userDocRef = doc(db, 'users', firebaseUser.uid);
      const userDoc = await getDoc(userDocRef);

      let userData: User;

      if (userDoc.exists()) {
        userData = userDoc.data() as User;
      } else {
        // Default to viewer for new users, unless it's the admin email
        const isAdminEmail = firebaseUser.email === 'analistadedatosnova@gmail.com';
        userData = {
          username: firebaseUser.email?.split('@')[0] || 'user',
          name: firebaseUser.displayName || 'Usuario',
          role: isAdminEmail ? 'admin' : 'viewer',
          email: firebaseUser.email || undefined
        };
        await setDoc(userDocRef, userData);
      }

      onLogin(userData);
    } catch (err: any) {
      console.error("Login error:", err);
      if (err.code === 'auth/unauthorized-domain') {
        setError(
          `Dominio no autorizado. Por favor, agregue "${window.location.hostname}" a la lista de dominios autorizados en la consola de Firebase (Authentication > Settings > Authorized domains).`
        );
      } else {
        setError(err.message || "Error al iniciar sesión con Google");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white max-w-2xl w-full rounded-2xl shadow-xl overflow-hidden flex flex-col md:flex-row">
        <div className="bg-[#1e3a8a] p-8 md:w-1/2 flex flex-col justify-center text-white">
          <h1 className="text-3xl font-bold mb-4">FiscalControl Pro</h1>
          <p className="text-blue-200 mb-6">
            Sistema integral de gestión de pagos fiscales y parafiscales.
          </p>
          <div className="text-sm opacity-75">
            <p>• Control de Presupuestos</p>
            <p>• Historial Detallado</p>
            <p>• Integración Cloud con Firebase</p>
          </div>
        </div>
        
        <div className="p-8 md:w-1/2 flex flex-col justify-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Bienvenido</h2>
          <p className="text-gray-500 text-sm mb-8 text-center">Inicie sesión con su cuenta de Google para acceder al sistema.</p>
          
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
              {error}
            </div>
          )}

          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center p-4 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition shadow-sm font-medium text-gray-700 disabled:opacity-50"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mr-3"></div>
            ) : (
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5 mr-3" alt="Google" />
            )}
            {loading ? 'Iniciando sesión...' : 'Continuar con Google'}
          </button>

          <div className="mt-8 pt-6 border-t border-gray-100">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4 text-center">Roles Disponibles</h3>
            <div className="grid grid-cols-3 gap-2">
              <div className="flex flex-col items-center p-2 bg-blue-50 rounded-lg">
                <Shield className="w-4 h-4 text-blue-600 mb-1" />
                <span className="text-[10px] font-medium text-blue-700">Admin</span>
              </div>
              <div className="flex flex-col items-center p-2 bg-green-50 rounded-lg">
                <UserIcon className="w-4 h-4 text-green-600 mb-1" />
                <span className="text-[10px] font-medium text-green-700">Pagador</span>
              </div>
              <div className="flex flex-col items-center p-2 bg-purple-50 rounded-lg">
                <Eye className="w-4 h-4 text-purple-600 mb-1" />
                <span className="text-[10px] font-medium text-purple-700">Visor</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
