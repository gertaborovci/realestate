import React, { useState, useEffect } from 'react';

const TransactionDashboard = () => {
    const [summary, setSummary] = useState({ grossRevenue: 180000, totalExpenses: 0, netProfit: 180000 });
    const [expenses, setExpenses] = useState([]);
    const [newExpense, setNewExpense] = useState({ category: 'Marketing', amount: '', description: '', expense_date: '' });

    useEffect(() => {
        fetchFinancialData();
    }, []);

    const fetchFinancialData = () => {
        fetch('http://localhost:5000/api/financial-summary')
            .then(res => res.json())
            .then(data => {
                setSummary({
                    grossRevenue: data.grossRevenue || 180000,
                    totalExpenses: data.totalExpenses || 0,
                    netProfit: data.netProfit || 180000
                });
            })
            .catch(err => console.error("Error fetching summary:", err));

        fetch('http://localhost:5000/api/expenses')
            .then(res => res.json())
            .then(data => {
                const expenseList = Array.isArray(data) ? data : [];
                setExpenses(expenseList);

                const totalCalculated = expenseList.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);
                const currentGross = summary.grossRevenue || 180000;
                
                setSummary(prev => ({
                    ...prev,
                    totalExpenses: totalCalculated,
                    netProfit: currentGross - totalCalculated
                }));
            })
            .catch(err => console.error("Error fetching expenses:", err));
    };

    const handleAddExpense = (e) => {
        e.preventDefault();
        if (!newExpense.amount || !newExpense.expense_date) return;

        fetch('http://localhost:5000/api/expenses', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newExpense)
        })
        .then(res => res.json())
        .then(() => {
            fetchFinancialData();
            setNewExpense({ category: 'Marketing', amount: '', description: '', expense_date: '' });
        })
        .catch(err => console.error("Error adding expense:", err));
    };

    return (
        <div style={{ backgroundColor: '#000', color: '#fff', padding: '40px', minHeight: '100vh', fontFamily: 'sans-serif' }}>
            <h2 style={{ borderBottom: '1px solid #222', paddingBottom: '10px', textTransform: 'uppercase', letterSpacing: '2px', fontSize: '20px' }}>Transactions & Financial Summary</h2>
            
            <div style={{ display: 'flex', gap: '20px', margin: '30px 0', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: '200px', backgroundColor: '#111', padding: '20px', border: '1px solid #222', borderRadius: '4px' }}>
                    <p style={{ color: '#888', margin: 0, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px' }}>Gross Revenue</p>
                    <h3 style={{ margin: '10px 0 0 0', color: '#fff', fontSize: '24px', fontWeight: 'normal' }}>
                        ${Number(summary.grossRevenue).toLocaleString()}
                    </h3>
                </div>
                <div style={{ flex: 1, minWidth: '200px', backgroundColor: '#111', padding: '20px', border: '1px solid #222', borderRadius: '4px' }}>
                    <p style={{ color: '#888', margin: 0, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px' }}>Total Expenses</p>
                    <h3 style={{ margin: '10px 0 0 0', color: '#ff4444', fontSize: '24px', fontWeight: 'normal' }}>
                        -${Number(summary.totalExpenses).toLocaleString()}
                    </h3>
                </div>
                <div style={{ flex: 1, minWidth: '200px', backgroundColor: '#111', padding: '20px', border: '1px solid #333', borderRadius: '4px' }}>
                    <p style={{ color: '#888', margin: 0, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px' }}>Net Profit</p>
                    <h3 style={{ margin: '10px 0 0 0', color: '#fff', fontSize: '24px', fontWeight: 'bold' }}>
                        ${Number(summary.netProfit).toLocaleString()}
                    </h3>
                </div>
            </div>

            <div style={{ backgroundColor: '#111', padding: '25px', border: '1px solid #222', borderRadius: '4px', marginBottom: '40px' }}>
                <h4 style={{ margin: '0 0 20px 0', textTransform: 'uppercase', fontSize: '12px', letterSpacing: '1px', color: '#aaa' }}>Add Agency Expense</h4>
                <form onSubmit={handleAddExpense} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '15px' }}>
                    <select 
                        value={newExpense.category} 
                        onChange={e => setNewExpense({...newExpense, category: e.target.value})} 
                        style={{ backgroundColor: '#000', color: '#fff', border: '1px solid #333', padding: '10px', borderRadius: '4px', fontSize: '13px', outline: 'none' }}
                    >
                        <option value="Marketing">Marketing</option>
                        <option value="Maintenance">Maintenance</option>
                        <option value="Salaries">Salaries</option>
                        <option value="Office Supplies">Office Supplies</option>
                        <option value="Utilities">Utilities</option>
                    </select>

                    <input 
                        type="number" 
                        placeholder="Amount ($)" 
                        value={newExpense.amount} 
                        onChange={e => setNewExpense({...newExpense, amount: e.target.value})} 
                        style={{ backgroundColor: '#000', color: '#fff', border: '1px solid #333', padding: '10px', borderRadius: '4px', fontSize: '13px' }} 
                        required 
                    />
                    <input 
                        type="text" 
                        placeholder="Description" 
                        value={newExpense.description} 
                        onChange={e => setNewExpense({...newExpense, description: e.target.value})} 
                        style={{ backgroundColor: '#000', color: '#fff', border: '1px solid #333', padding: '10px', borderRadius: '4px', fontSize: '13px' }} 
                    />
                    <input 
                        type="date" 
                        value={newExpense.expense_date} 
                        onChange={e => setNewExpense({...newExpense, expense_date: e.target.value})} 
                        style={{ backgroundColor: '#000', color: '#fff', border: '1px solid #333', padding: '10px', borderRadius: '4px', fontSize: '13px', colorScheme: 'dark' }} 
                        required 
                    />
                    <button type="submit" style={{ backgroundColor: '#fff', color: '#000', border: 'none', padding: '10px', cursor: 'pointer', fontWeight: 'bold', borderRadius: '4px', textTransform: 'uppercase', fontSize: '11px', letterSpacing: '1px' }}>Save</button>
                </form>
            </div>

            <h4 style={{ textTransform: 'uppercase', fontSize: '12px', letterSpacing: '1px', color: '#888' }}>Expense Logs</h4>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '15px', textAlign: 'left' }}>
                <thead>
                    <tr style={{ borderBottom: '1px solid #222', color: '#666', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                        <th style={{ padding: '12px' }}>Date</th>
                        <th style={{ padding: '12px' }}>Category</th>
                        <th style={{ padding: '12px' }}>Description</th>
                        <th style={{ padding: '12px', textAlign: 'right' }}>Amount</th>
                    </tr>
                </thead>
                <tbody>
                    {expenses.length === 0 ? (
                        <tr><td colSpan="4" style={{ padding: '20px', color: '#444', fontSize: '13px' }}>No expenses recorded yet.</td></tr>
                    ) : (
                        expenses.map(exp => (
                            <tr key={exp.id} style={{ borderBottom: '1px solid #111', fontSize: '13px' }}>
                                <td style={{ padding: '12px', color: '#888' }}>{new Date(exp.expense_date).toLocaleDateString()}</td>
                                <td style={{ padding: '12px', fontWeight: '500' }}>{exp.category}</td>
                                <td style={{ padding: '12px', color: '#aaa' }}>{exp.description || '-'}</td>
                                <td style={{ padding: '12px', textAlign: 'right', color: '#ff4444' }}>-${parseFloat(exp.amount).toLocaleString()}</td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default TransactionDashboard;