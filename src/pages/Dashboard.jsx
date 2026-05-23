import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import PropertyTable from '../components/PropertyTable';
import AddProperty from './AddProperty';

const Dashboard = () => {
  // 1. State for holding our database properties
  const [properties, setProperties] = useState([]);
  
  // 2. State to toggle between the 'table' view and the 'add' form
  const [currentView, setCurrentView] = useState('table');
  const [editingProperty, setEditingProperty] = useState(null);

  // 3. Fetch real data from your Node.js Backend
  const fetchProperties = () => {
    fetch('http://localhost:5000/api/properties')
      .then(res => res.json())
      .then(data => setProperties(data))
      .catch(err => console.error("Error fetching properties:", err));
  };

  // Run the fetch when the Dashboard opens
  useEffect(() => {
    fetchProperties();
  }, []);

  // 4. Handle Deleting (Member 2 can expand on this later, but we need the UI to work)
  const handleDelete = async (id) => {
    try {
      await fetch(`http://localhost:5000/api/properties/${id}`, { method: 'DELETE' });
      setProperties(properties.filter(p => p.id !== id)); // Remove from screen
    } catch (error) {
      console.error("Error deleting:", error);
    }
  };

  // 5. Handle Editing
  const handleEdit = (property) => {
    setEditingProperty(property);
    setCurrentView('add');
  };

  return (
    <div className="flex min-h-screen bg-[#050505] text-white font-sans">
      {/* SIDEBAR COMPONENT */}
      <Sidebar />

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 p-10 md:ml-64">
        <div className="max-w-6xl mx-auto">
          
          {/* If current view is 'table', show the list. Otherwise, show the Add Form */}
          {currentView === 'table' ? (
            <div className="animate-in fade-in duration-500">
              <div className="flex justify-between items-center mb-10">
                <h1 className="text-5xl font-black tracking-tighter uppercase">Pronat</h1>
                <button 
                  onClick={() => {
                    setEditingProperty(null);
                    setCurrentView('add');
                  }}
                  className="bg-white text-black font-bold text-[11px] tracking-widest px-6 py-3 rounded-full uppercase hover:bg-gray-200 transition"
                >
                  Shto +
                </button>
              </div>
              
              {/* PROPERTY TABLE COMPONENT */}
              <PropertyTable 
                properties={properties} 
                onDelete={handleDelete} 
                onEdit={handleEdit} 
              />
            </div>
          ) : (
            /* ADD PROPERTY COMPONENT */
            <AddProperty 
              onBack={() => setCurrentView('table')} 
              onAdd={(newProp) => {
                fetchProperties(); // Refresh the list from the database after adding
                setCurrentView('table'); // Go back to the table view
              }} 
              editData={editingProperty}
            />
          )}

        </div>
      </div>
    </div>
  );
};

export default Dashboard;