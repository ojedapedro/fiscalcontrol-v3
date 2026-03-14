import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { PaymentRecord, BudgetSummary } from '../types';
import { Calendar, AlertCircle } from 'lucide-react';

interface DashboardProps {
  records: PaymentRecord[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

const Dashboard: React.FC<DashboardProps> = ({ records }) => {
  
  const budgetData = useMemo(() => {
    const summary: Record<string, BudgetSummary> = {};

    records.forEach(record => {
      if (!summary[record.paymentType]) {
        summary[record.paymentType] = {
          type: record.paymentType,
          totalSpent: 0,
          projectedAnnual: 0,
          count: 0
        };
      }
      summary[record.paymentType].totalSpent += record.amount;
      summary[record.paymentType].count += 1;
    });

    Object.keys(summary).forEach(key => {
        // Simple projection: Total * 12 (Estimation logic)
        summary[key].projectedAnnual = summary[key].totalSpent * 12; 
    });

    return Object.values(summary);
  }, [records]);

  const totalSpent = records.reduce((acc, curr) => acc + curr.amount, 0);
  
  // Fake "Pending" logic: assuming items with future dates or flagged in sheet are pending
  // For this demo, let's treat "Pending" status if available, or just random logic if not fully implemented in form
  const pendingRecords = records.filter(r => r.status === 'Pending Review');
  const pendingAmount = pendingRecords.reduce((acc, curr) => acc + curr.amount, 0);

  // Upcoming deadlines (Next 30 days)
  const upcomingDeadlines = useMemo(() => {
    const today = new Date();
    const thirtyDaysLater = new Date();
    thirtyDaysLater.setDate(today.getDate() + 30);

    return records
      .filter(r => {
        const d = new Date(r.paymentDateReal);
        return d >= today && d <= thirtyDaysLater;
      })
      .sort((a, b) => new Date(a.paymentDateReal).getTime() - new Date(b.paymentDateReal).getTime())
      .slice(0, 5); // Take top 5
  }, [records]);

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-blue-600">
          <p className="text-gray-500 text-sm font-medium">Total Pagado</p>
          <p className="text-2xl font-bold text-gray-800">${totalSpent.toLocaleString()}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-green-600">
          <p className="text-gray-500 text-sm font-medium">Registros Totales</p>
          <p className="text-2xl font-bold text-gray-800">{records.length}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-yellow-500">
          <p className="text-gray-500 text-sm font-medium">Por Pagar (Pendientes)</p>
          <p className="text-2xl font-bold text-gray-800">${pendingAmount.toLocaleString()}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-purple-600">
          <p className="text-gray-500 text-sm font-medium">Proyección Anual Total</p>
          <p className="text-2xl font-bold text-gray-800">${(totalSpent * 12).toLocaleString()}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-bold text-gray-700 mb-4">Presupuesto Anual Estimado</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={budgetData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="type" tick={{fontSize: 10}} interval={0} />
                <YAxis />
                <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
                <Legend />
                <Bar dataKey="totalSpent" name="Gasto Actual" fill="#1e3a8a" />
                <Bar dataKey="projectedAnnual" name="Proyección Anual" fill="#93c5fd" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Calendar / Upcoming */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-700">Próximos Vencimientos</h3>
            <Calendar className="text-blue-600 h-5 w-5" />
          </div>
          <div className="space-y-4">
            {upcomingDeadlines.length > 0 ? (
              upcomingDeadlines.map(record => (
                <div key={record.id} className="flex items-start p-3 bg-gray-50 rounded-md border-l-4 border-yellow-400">
                  <div className="flex-1">
                    <p className="font-semibold text-gray-800 text-sm">{record.organism}</p>
                    <p className="text-xs text-gray-500">{record.paymentType}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-gray-700">{record.paymentDateReal}</p>
                    <p className="text-xs text-blue-600 font-bold">${record.amount}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-400">
                <AlertCircle className="mx-auto h-8 w-8 mb-2 opacity-50" />
                <p className="text-sm">No hay vencimientos próximos.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-bold text-gray-700 mb-4">Distribución de Gastos</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={budgetData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="totalSpent"
              >
                {budgetData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;