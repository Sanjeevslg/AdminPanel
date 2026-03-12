import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Toast from './Toast';

const Dashboard = () => {
  const [allProperties, setAllProperties] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingProperty, setEditingProperty] = useState(null);
  const [toast, setToast] = useState({ show: false, message: '', type: '' });
  const navigate = useNavigate();

  const showToast = (message, type) => {
    setToast({ show: true, message, type });
  };

  useEffect(() => {
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    const res = await fetch('https://sevokerealty.in/api.php?type=properties');
    const data = await res.json();
    setAllProperties(data);
  };

  const filteredProperties = allProperties.filter(prop => 
    prop.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    prop.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = async (id) => {
    if (window.confirm("Delete this property?")) {
      const fd = new FormData();
      fd.append('id', id);
      try {
        const res = await fetch('https://sevokerealty.in/api.php?type=delete_property', { method: 'POST', body: fd });
        const data = await res.json();
        if(data.success) {
          showToast("Property deleted", "success");
          fetchProperties();
        }
      } catch (err) {
        showToast("Connection error", "error");
      }
    }
  };

  const openEditModal = (prop) => {
    setEditingProperty({ ...prop });
    setIsEditModalOpen(true);
  };

  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    Object.keys(editingProperty).forEach(key => formData.append(key, editingProperty[key]));

    const res = await fetch('https://sevokerealty.in/api.php?type=update_property', {
      method: 'POST',
      body: formData,
    });
    
    const data = await res.json();
    if (data.success) {
      showToast("Updated successfully!", "success");
      setIsEditModalOpen(false);
      fetchProperties();
    } else {
      showToast("Update failed", "error");
    }
  };

  return (
    <div className="bg-gray-100 min-h-screen w-full relative pb-10">
      {toast.show && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast({ ...toast, show: false })} />
      )}

      <nav className="bg-white border-b px-4 md:px-8 py-4 flex flex-col md:flex-row justify-between items-center sticky top-0 z-40 gap-4 shadow-sm">
        <div className="text-center md:text-left">
          <h1 className="text-xl md:text-2xl font-bold text-blue-900 leading-tight">Sevoke Realty</h1>
          <p className="text-[10px] md:text-xs font-bold text-gray-400 uppercase tracking-widest">Admin Panel</p>
        </div>
        <div className="flex w-full md:w-auto gap-2">
          <button onClick={() => navigate('/add-property')} className="flex-1 md:flex-none bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-md">+ Add New</button>
          <button onClick={() => { localStorage.removeItem('isLoggedIn'); navigate('/login'); }} className="flex-1 md:flex-none bg-red-50 text-red-600 px-5 py-2.5 rounded-xl font-bold text-sm">Logout</button>
        </div>
      </nav>

      <div className="p-4 md:p-8 w-full max-w-7xl mx-auto">
        {/* Search Bar */}
        <div className="mb-6 relative">
          <input 
            type="text" 
            placeholder="Search by name or location..." 
            className="w-full p-4 pl-12 rounded-2xl border-none shadow-sm focus:ring-2 ring-blue-500 outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <span className="absolute left-4 top-1/2 -translate-y-1/2 opacity-30 text-xl">🔍</span>
        </div>

        {/* MOBILE CARD VIEW */}
        <div className="grid grid-cols-1 gap-4 md:hidden">
          {filteredProperties.map(prop => (
            <div key={prop.id} className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100">
              <div className="flex gap-4 mb-4">
                <img src={`https://sevokerealty.in/${prop.image_url}`} className="w-20 h-20 object-cover rounded-2xl border" alt="property" />
                <div className="flex-1">
                  <span className="text-[10px] font-bold text-blue-600 uppercase bg-blue-50 px-2 py-0.5 rounded-md">{prop.category}</span>
                  <h3 className="font-bold text-gray-900 mt-1">{prop.name}</h3>
                  <p className="text-xs text-gray-500 mt-0.5">📍 {prop.location}</p>
                </div>
              </div>
              <div className="flex gap-2 border-t pt-3">
                <button onClick={() => openEditModal(prop)} className="flex-1 bg-blue-50 text-blue-600 py-2 rounded-xl font-bold text-xs">Modify</button>
                <button onClick={() => handleDelete(prop.id)} className="flex-1 bg-red-50 text-red-500 py-2 rounded-xl font-bold text-xs">Delete</button>
              </div>
            </div>
          ))}
        </div>

        {/* DESKTOP TABLE VIEW */}
        <div className="hidden md:block bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-gray-400 uppercase text-[10px] font-black tracking-widest border-b">
              <tr>
                <th className="p-5">Image</th>
                <th className="p-5">Property Details</th>
                <th className="p-5">Category</th>
                <th className="p-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredProperties.map(prop => (
                <tr key={prop.id} className="hover:bg-blue-50/30 transition-colors">
                  <td className="p-5">
                    <img src={`https://sevokerealty.in/${prop.image_url}`} className="w-20 h-14 object-cover rounded-xl shadow-sm" alt="thumb" />
                  </td>
                  <td className="p-5">
                    <div className="font-bold text-gray-900">{prop.name}</div>
                    <div className="text-xs text-gray-500">📍 {prop.location}</div>
                  </td>
                  <td className="p-5 capitalize">
                    <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-bold">{prop.category}</span>
                  </td>
                  <td className="p-5 text-right space-x-2">
                    <button onClick={() => openEditModal(prop)} className="text-blue-600 font-bold hover:underline px-2 text-sm">Modify</button>
                    <button onClick={() => handleDelete(prop.id)} className="text-red-500 font-bold hover:underline px-2 text-sm">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL (Responsive) */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-blue-900/40 backdrop-blur-sm flex items-end md:items-center justify-center z-[110] p-0 md:p-4">
          <div className="bg-white rounded-t-3xl md:rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom md:zoom-in duration-300">
             <div className="p-6 border-b flex justify-between items-center sticky top-0 bg-white z-10">
              <h2 className="text-lg font-black text-blue-900 uppercase">Edit Property</h2>
              <button onClick={() => setIsEditModalOpen(false)} className="text-gray-400 text-3xl">&times;</button>
            </div>
            <form onSubmit={handleUpdateSubmit} className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <input className="bg-gray-50 p-3 rounded-xl border-none outline-none ring-1 ring-gray-200 focus:ring-2 focus:ring-blue-500" value={editingProperty.name} onChange={e => setEditingProperty({...editingProperty, name: e.target.value})} required />
              <input className="bg-gray-50 p-3 rounded-xl border-none outline-none ring-1 ring-gray-200 focus:ring-2 focus:ring-blue-500" value={editingProperty.location} onChange={e => setEditingProperty({...editingProperty, location: e.target.value})} required />
              <input className="bg-gray-50 p-3 rounded-xl border-none outline-none ring-1 ring-gray-200 focus:ring-2 focus:ring-blue-500" value={editingProperty.price_text} onChange={e => setEditingProperty({...editingProperty, price_text: e.target.value})} />
              <input className="bg-gray-50 p-3 rounded-xl border-none outline-none ring-1 ring-gray-200 focus:ring-2 focus:ring-blue-500" value={editingProperty.type} onChange={e => setEditingProperty({...editingProperty, type: e.target.value})} />
              <input className="bg-gray-50 p-3 rounded-xl border-none outline-none ring-1 ring-gray-200 focus:ring-2 focus:ring-blue-500" value={editingProperty.developer} onChange={e => setEditingProperty({...editingProperty, developer: e.target.value})} />
              <input className="bg-gray-50 p-3 rounded-xl border-none outline-none ring-1 ring-gray-200 focus:ring-2 focus:ring-blue-500" value={editingProperty.availableOption} onChange={e => setEditingProperty({...editingProperty, availableOption: e.target.value})} />
              <textarea className="md:col-span-2 bg-gray-50 p-3 rounded-xl h-24 border-none outline-none ring-1 ring-gray-200 focus:ring-2 focus:ring-blue-500" value={editingProperty.description} onChange={e => setEditingProperty({...editingProperty, description: e.target.value})} />
              <button type="submit" className="md:col-span-2 bg-blue-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-blue-200">SAVE CHANGES</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;