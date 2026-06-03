import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Wrench, BarChart3, DollarSign, TrendingUp } from 'lucide-react';
import { API_BASE } from './lib/api';
import { showAlert, showConfirm } from './lib/modal';

const api = axios.create({ baseURL: API_BASE });

export default function TransactionDashboard() {
  const [subTab, setSubTab] = useState('expenses'); // Tabi fillestar shfaq grafikun

  // STATED PËR FINANCAT
  const [expenses, setExpenses] = useState([]);
  const [expense, setExpense] = useState({ category: 'Marketing', amount: '', description: '', expense_date: '' });
  const grossRevenue = 15000.00;

  // STATED PËR MIRËMBAJTJEN
  const [tickets, setTickets] = useState([]);
  const [ticket, setTicket] = useState({ property_id: '', tenant_id: '1', title: '', description: '' });

  const fetchExpenses = async () => {
    try {
      const res = await api.get('/api/expenses');
      setExpenses(res.data);
    } catch (err) { console.error(err); }
  };

  const fetchTickets = async () => {
    try {
      const res = await api.get('/api/maintenance');
      setTickets(res.data);
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    fetchExpenses();
    fetchTickets();
  }, []);

  const handleExpenseSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/api/expenses', expense);
      await showAlert("Shpenzimi u regjistrua me sukses!");
      setExpense({ category: 'Marketing', amount: '', description: '', expense_date: '' });
      fetchExpenses();
    } catch (err) { await showAlert("Gabim gjatë regjistrimit."); }
  };

  const handleTicketSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/api/maintenance', ticket);
      await showAlert("Tiketa e mirëmbajtjes u dërgua!");
      setTicket({ property_id: '', tenant_id: '1', title: '', description: '' });
      fetchTickets();
    } catch (err) { await showAlert("Gabim gjatë dërgimit."); }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await api.put(`/api/maintenance/${id}`, { status: newStatus });
      fetchTickets();
    } catch (err) { console.error(err); }
  };

  const totalExpenses = expenses.reduce((sum, item) => sum + parseFloat(item.amount), 0);
  const netProfit = grossRevenue - totalExpenses;

  const grossHeight = 120;
  const expenseHeight = grossRevenue > 0 ? (totalExpenses / grossRevenue) * 120 : 0;
  const profitHeight = grossRevenue > 0 ? (netProfit / grossRevenue) * 120 : 0;

  return (
    <div className="p-6 bg-slate-50 min-h-screen text-slate-800 font-sans rounded-2xl">
      
      {/* HEADER */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Financat & Logjistika</h1>
          <p className="text-sm text-slate-500 mt-1">Menaxhimi i raporteve monetare dhe logjistikës së mirëmbajtjes.</p>
        </div>
        <div className="flex items-center gap-2 bg-indigo-50 text-indigo-700 px-4 py-2 rounded-lg font-semibold text-sm border border-indigo-100">
          <TrendingUp size={16} /> Moduli i Ri Analitik
        </div>
      </div>

      {/* SUB-NAVIGATION (Butonat e brendshëm) */}
      <div className="flex gap-4 mb-8 border-b border-slate-200 pb-4">
        <button 
          onClick={() => setSubTab('expenses')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold tracking-wide transition-all ${subTab === 'expenses' ? 'bg-indigo-600 text-white shadow-md' : 'bg-white border text-slate-600 hover:bg-slate-100'}`}
        >
          <BarChart3 size={16} /> KONTABILITETI & GRAFIKU
        </button>
        <button 
          onClick={() => setSubTab('maintenance')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold tracking-wide transition-all ${subTab === 'maintenance' ? 'bg-indigo-600 text-white shadow-md' : 'bg-white border text-slate-600 hover:bg-slate-100'}`}
        >
          <Wrench size={16} /> MANTENANCA E PRONAVE
        </button>
      </div>

      {/* TABI 1: EXPENSES & CHARTS */}
      {subTab === 'expenses' && (
        <div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Gross Revenue</p>
                <h3 className="text-2xl font-bold mt-1 text-emerald-600">{grossRevenue} €</h3>
              </div>
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl"><DollarSign size={24} /></div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Expenses</p>
                <h3 className="text-2xl font-bold mt-1 text-red-600">-{totalExpenses.toFixed(2)} €</h3>
              </div>
              <div className="p-3 bg-red-50 text-red-600 rounded-xl"><DollarSign size={24} /></div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Net Profit</p>
                <h3 className="text-2xl font-bold mt-1 text-indigo-600">{netProfit.toFixed(2)} €</h3>
              </div>
              <div className="p-3 bg-indigo-50 text-indigo-700 rounded-xl"><DollarSign size={24} /></div>
            </div>
          </div>

          {/* GRAFIKU ME CSS */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mb-8">
            <h2 className="text-lg font-bold text-slate-900 mb-4">Grafiku Krahasimor Financiar</h2>
            <div className="h-64 flex items-end justify-around border-b border-slate-200 pb-2 px-12 pt-8">
              <div className="flex flex-col items-center group relative">
                <div style={{ height: `${grossHeight}px` }} className="w-16 bg-emerald-500 rounded-t-lg transition-all duration-300" />
                <span className="text-xs font-bold text-slate-600 mt-2">Gross Revenue</span>
              </div>
              <div className="flex flex-col items-center group relative">
                <div style={{ height: `${expenseHeight}px` }} className="w-16 bg-red-500 rounded-t-lg transition-all duration-300" />
                <span className="text-xs font-bold text-slate-600 mt-2">Expenses</span>
              </div>
              <div className="flex flex-col items-center group relative">
                <div style={{ height: `${profitHeight}px` }} className="w-16 bg-amber-500 rounded-t-lg transition-all duration-300" />
                <span className="text-xs font-bold text-slate-600 mt-2">Net Profit</span>
              </div>
            </div>
          </div>

          {/* FORMA E SHPENZIMEVE */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mb-8">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Regjistro Shpenzim të Ri</h3>
            <form onSubmit={handleExpenseSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <select className="p-2.5 bg-slate-50 border rounded-lg text-sm" value={expense.category} onChange={(e) => setExpense({...expense, category: e.target.value})}>
                <option value="Marketing">Marketing</option>
                <option value="Office Rent">Office Rent</option>
                <option value="Agent Bonuses">Agent Bonuses</option>
                <option value="Utilities">Utilities</option>
              </select>
              <input className="p-2.5 bg-slate-50 border rounded-lg text-sm" type="number" placeholder="Shuma (€)" value={expense.amount} onChange={(e) => setExpense({...expense, amount: e.target.value})} required />
              <input className="p-2.5 bg-slate-50 border rounded-lg text-sm" type="date" value={expense.expense_date} onChange={(e) => setExpense({...expense, expense_date: e.target.value})} required />
              <button type="submit" className="bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700">Shto</button>
            </form>
          </div>
        </div>
      )}

      {/* TABI 2: MAINTENANCE TICKETS */}
      {subTab === 'maintenance' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-fit">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Raporto një Defekt</h3>
            <form onSubmit={handleTicketSubmit} className="space-y-4">
              <input className="w-full p-2.5 bg-slate-50 border rounded-lg text-sm" type="number" placeholder="ID e Pronës" value={ticket.property_id} onChange={(e) => setTicket({...ticket, property_id: e.target.value})} required />
              <input className="w-full p-2.5 bg-slate-50 border rounded-lg text-sm" type="text" placeholder="Titulli i problemit" value={ticket.title} onChange={(e) => setTicket({...ticket, title: e.target.value})} required />
              <textarea className="w-full p-2.5 bg-slate-50 border rounded-lg text-sm h-24" placeholder="Përshkrimi..." value={ticket.description} onChange={(e) => setTicket({...ticket, description: e.target.value})} required />
              <button type="submit" className="w-full py-2.5 bg-indigo-600 text-white font-semibold rounded-lg text-sm hover:bg-indigo-700">Dërgo</button>
            </form>
          </div>

          <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Menaxhimi i Ndërhyrjeve</h3>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="bg-slate-100 text-slate-600"><th className="p-3">Prona</th><th className="p-3">Titulli</th><th className="p-3">Statusi</th><th className="p-3">Veprimi</th></tr>
                </thead>
                <tbody>
                  {tickets.map(t => (
                    <tr key={t.id} className="border-b">
                      <td className="p-3 font-semibold"># {t.property_id}</td>
                      <td className="p-3">{t.title}</td>
                      <td className="p-3 font-bold">{t.status}</td>
                      <td className="p-3">
                        <select className="p-1 border rounded" value={t.status} onChange={(e) => handleStatusChange(t.id, e.target.value)}>
                          <option value="Pending">Pending</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Resolved">Resolved</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}