import React, { useState, useMemo } from 'react';
import { PaymentRecord, PaymentType, User, PaymentStatus } from '../types';
import { Search, Filter, ArrowDownUp, Check, X, MessageSquare } from 'lucide-react';
import { PAYMENT_TYPES } from '../constants';
import { updatePaymentStatusInFirestore } from '../services/firebaseService';

interface PaymentHistoryProps {
  records: PaymentRecord[];
  user: User;
}

const PaymentHistory: React.FC<PaymentHistoryProps> = ({ records, user }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('All');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [processingId, setProcessingId] = useState<string | null>(null);

  const filteredRecords = useMemo(() => {
    return records
      .filter(record => {
        const matchesSearch = 
          record.organism.toLowerCase().includes(searchTerm.toLowerCase()) ||
          record.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          record.municipality.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesType = typeFilter === 'All' || record.paymentType === typeFilter;

        return matchesSearch && matchesType;
      })
      .sort((a, b) => {
        const dateA = new Date(a.dateRegistered).getTime();
        const dateB = new Date(b.dateRegistered).getTime();
        return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
      });
  }, [records, searchTerm, typeFilter, sortOrder]);

  const handleApproval = async (record: PaymentRecord, approved: boolean) => {
    setProcessingId(record.id);
    const newStatus: PaymentStatus = approved ? 'Approved' : 'Rejected';
    
    try {
      // 1. Update Backend (Firestore)
      await updatePaymentStatusInFirestore(record.id, newStatus);
      
      // 2. Trigger Report (WhatsApp)
      const actionText = approved ? "APROBADO" : "RECHAZADO";
      const icon = approved ? "✅" : "❌";
      
      const message = `*${icon} REPORTE DE AUDITORÍA DE PAGOS*%0A%0A` +
        `*Resultado:* ${actionText}%0A` +
        `*Organismo:* ${record.organism}%0A` +
        `*Monto:* $${record.amount}%0A` +
        `*Auditor:* ${user.name}%0A` +
        `*Fecha:* ${new Date().toLocaleDateString()}%0A%0A` +
        `_Sistema de Control Fiscal_`;

      // Open WhatsApp
      window.open(`https://wa.me/?text=${message}`, '_blank');
      
    } catch (err) {
      console.error("Error updating status:", err);
      alert("Error al actualizar el estado en Firebase.");
    } finally {
      setProcessingId(null);
    }
  };

  // Logic: Viewers (Auditors) and Admins can approve. Payers cannot.
  const canApprove = ['admin', 'viewer'].includes(user.role);

  const getStatusColor = (status: PaymentStatus) => {
    switch(status) {
      case 'Approved': return 'bg-green-100 text-green-800';
      case 'Rejected': return 'bg-red-100 text-red-800';
      case 'Pending Review': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: PaymentStatus) => {
    switch(status) {
      case 'Approved': return 'Aprobado';
      case 'Rejected': return 'Rechazado';
      case 'Pending Review': return 'Revisión Pendiente';
      default: return status;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <div>
           <h2 className="text-xl font-bold text-gray-800">Historial y Auditoría</h2>
           <p className="text-xs text-gray-500">Paso 2: Revisión y Aprobación de Pagos</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm w-full"
            />
          </div>
          
          <div className="relative">
            <Filter className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white appearance-none w-full"
            >
              <option value="All">Todos los Tipos</option>
              {PAYMENT_TYPES.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          <button 
            onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
            className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            title="Ordenar por fecha"
          >
            <ArrowDownUp className="h-5 w-5 text-gray-600" />
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Organismo</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Monto</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
              {canApprove && (
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones (Auditor)</th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredRecords.length > 0 ? (
              filteredRecords.map((record) => (
                <tr key={record.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{record.paymentDateReal}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {record.organism}
                    <div className="text-xs text-gray-400 font-normal">{record.description}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-50 text-blue-700">
                      {record.paymentType}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-bold">
                    ${record.amount.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(record.status)}`}>
                      {getStatusLabel(record.status)}
                    </span>
                  </td>
                  
                  {canApprove && (
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      {record.status === 'Pending Review' ? (
                        <div className="flex justify-center space-x-2">
                           {processingId === record.id ? (
                             <span className="text-gray-400 text-xs">Procesando...</span>
                           ) : (
                             <>
                                <button 
                                  onClick={() => handleApproval(record, true)}
                                  className="p-1 bg-green-100 hover:bg-green-200 text-green-700 rounded-full transition"
                                  title="Aprobar y Reportar"
                                >
                                  <Check className="w-5 h-5" />
                                </button>
                                <button 
                                  onClick={() => handleApproval(record, false)}
                                  className="p-1 bg-red-100 hover:bg-red-200 text-red-700 rounded-full transition"
                                  title="Rechazar y Reportar"
                                >
                                  <X className="w-5 h-5" />
                                </button>
                             </>
                           )}
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400 italic">Auditoria Completada</span>
                      )}
                    </td>
                  )}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="px-6 py-10 text-center text-sm text-gray-500">
                  No se encontraron registros.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PaymentHistory;