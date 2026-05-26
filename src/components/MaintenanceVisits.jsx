import React, { useState, useEffect } from 'react';

const MaintenanceVisits = () => {
  const [tickets, setTickets] = useState([]);

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = () => {
    fetch('http://localhost:5000/api/maintenance')
      .then(res => res.json())
      .then(data => setTickets(Array.isArray(data) ? data : []))
      .catch(err => console.error("Error fetching tickets:", err));
  };

  const handleStatusChange = (id, currentStatus, title) => {
    let cost = 0;
    const nextStatus = currentStatus === 'Pending' ? 'Resolved' : 'Pending';
    
    if (nextStatus === 'Resolved') {
      const inputCost = prompt(`Sa ka kushtuar riparimi për tiletën "${title}"? ($):`, "0");
      cost = parseFloat(inputCost);
      if (isNaN(cost) || cost < 0) cost = 0;
    }
    
    fetch(`http://localhost:5000/api/maintenance/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: nextStatus, cost: cost, title: title })
    })
    .then(() => fetchTickets())
    .catch(err => console.error("Error updating ticket status:", err));
  };

  return (
    <div style={{ backgroundColor: '#000', color: '#fff', padding: '40px', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      <h2 style={{ borderBottom: '1px solid #222', paddingBottom: '10px', textTransform: 'uppercase', letterSpacing: '2px', fontSize: '20px', marginBottom: '30px' }}>
        Visits & Property Logistics
      </h2>

      <div style={{ backgroundColor: '#111', padding: '25px', border: '1px solid #222', borderRadius: '4px' }}>
        <h4 style={{ margin: '0 0 20px 0', textTransform: 'uppercase', fontSize: '12px', letterSpacing: '1px', color: '#888' }}>
          Active Maintenance Requests
        </h4>
        
        <div style={{ display: 'grid', gap: '15px' }}>
          {tickets.length === 0 ? (
            <div style={{ padding: '30px', color: '#444', textAlign: 'center', border: '1px dashed #222', fontSize: '13px' }}>
              No active maintenance tickets or logistics visits scheduled.
            </div>
          ) : (
            tickets.map(ticket => (
              <div key={ticket.id} style={{ backgroundColor: '#000', border: '1px solid #222', padding: '20px', borderRadius: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
                <div>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '5px' }}>
                    <span style={{ 
                      fontSize: '10px', 
                      fontWeight: 'bold', 
                      textTransform: 'uppercase', 
                      padding: '3px 8px', 
                      borderRadius: '3px',
                      backgroundColor: ticket.status === 'Pending' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                      color: ticket.status === 'Pending' ? '#f59e0b' : '#10b981'
                    }}>
                      {ticket.status}
                    </span>
                    <span style={{ fontSize: '11px', color: '#555' }}>
                      Property: {ticket.property_title || `ID ${ticket.property_id}`}
                    </span>
                  </div>
                  <h5 style={{ margin: '5px 0', fontSize: '16px', fontWeight: 'bold' }}>{ticket.title}</h5>
                  <p style={{ margin: '0', fontSize: '13px', color: '#aaa' }}>{ticket.description}</p>
                  <small style={{ color: '#444', fontSize: '11px' }}>Logged: {new Date(ticket.created_at).toLocaleDateString()}</small>
                </div>

                <button 
                  onClick={() => handleStatusChange(ticket.id, ticket.status, ticket.title)}
                  style={{ 
                    backgroundColor: ticket.status === 'Pending' ? '#fff' : 'transparent', 
                    color: ticket.status === 'Pending' ? '#000' : '#666', 
                    border: ticket.status === 'Pending' ? 'none' : '1px solid #222',
                    padding: '10px 20px', 
                    cursor: 'pointer', 
                    fontWeight: 'bold', 
                    borderRadius: '4px', 
                    textTransform: 'uppercase', 
                    fontSize: '11px', 
                    letterSpacing: '1px' 
                  }}
                >
                  Mark as {ticket.status === 'Pending' ? 'Resolved' : 'Pending'}
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default MaintenanceVisits;