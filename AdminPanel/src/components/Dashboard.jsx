import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Toast from './Toast';
import { API_URL as API } from '../config/api';

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('properties'); // 'properties' | 'projects'

  // ── Properties state ──────────────────────────────────────────
  const [allProperties, setAllProperties] = useState([]);
  const [propSearch, setPropSearch] = useState('');
  const [isEditPropOpen, setIsEditPropOpen] = useState(false);
  const [editingProperty, setEditingProperty] = useState(null);

  // ── Projects state ────────────────────────────────────────────
  const [allProjects, setAllProjects] = useState([]);
  const [projSearch, setProjSearch] = useState('');
  const [isEditProjOpen, setIsEditProjOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);

  const [toast, setToast] = useState({ show: false, message: '', type: '' });
  const navigate = useNavigate();

  const showToast = (message, type) => setToast({ show: true, message, type });

  useEffect(() => { fetchProperties(); fetchProjects(); }, []);

  // ── Fetch ──────────────────────────────────────────────────────
  const fetchProperties = async () => {
    try {
      const res = await fetch(`${API}?type=properties`);
      const data = await res.json();
      setAllProperties(Array.isArray(data) ? data : []);
    } catch { showToast('Failed to load properties', 'error'); }
  };

  const fetchProjects = async () => {
    try {
      const res = await fetch(`${API}?type=projects`);
      const data = await res.json();
      setAllProjects(Array.isArray(data) ? data : []);
    } catch { showToast('Failed to load projects', 'error'); }
  };

  // ── Filtered lists ────────────────────────────────────────────
  const filteredProperties = allProperties.filter(p =>
    p.name?.toLowerCase().includes(propSearch.toLowerCase()) ||
    p.location?.toLowerCase().includes(propSearch.toLowerCase())
  );

  const filteredProjects = allProjects.filter(p =>
    p.name?.toLowerCase().includes(projSearch.toLowerCase()) ||
    p.location?.toLowerCase().includes(projSearch.toLowerCase())
  );

  // ── Property CRUD ─────────────────────────────────────────────
  const handleDeleteProperty = async (id) => {
    if (!window.confirm('Delete this property?')) return;
    const fd = new FormData();
    fd.append('id', id);
    try {
      const res = await fetch(`${API}?type=delete_property`, { method: 'POST', body: fd });
      const data = await res.json();
      if (data.success) { showToast('Property deleted', 'success'); fetchProperties(); }
    } catch { showToast('Connection error', 'error'); }
  };

  const openEditProperty = (prop) => { setEditingProperty({ ...prop }); setIsEditPropOpen(true); };

  const handleUpdateProperty = async (e) => {
    e.preventDefault();
    const fd = new FormData();
    Object.keys(editingProperty).forEach(key => fd.append(key, editingProperty[key] ?? ''));
    try {
      const res = await fetch(`${API}?type=update_property`, { method: 'POST', body: fd });
      const data = await res.json();
      if (data.success) {
        showToast('Updated successfully!', 'success');
        setIsEditPropOpen(false);
        fetchProperties();
      } else { showToast('Update failed', 'error'); }
    } catch { showToast('Connection error', 'error'); }
  };

  // ── Project CRUD ──────────────────────────────────────────────
  const handleDeleteProject = async (id) => {
    if (!window.confirm('Delete this project?')) return;
    const fd = new FormData();
    fd.append('id', id);
    try {
      const res = await fetch(`${API}?type=delete_project`, { method: 'POST', body: fd });
      const data = await res.json();
      if (data.success) { showToast('Project deleted', 'success'); fetchProjects(); }
    } catch { showToast('Connection error', 'error'); }
  };

  const openEditProject = (proj) => { setEditingProject({ ...proj }); setIsEditProjOpen(true); };

  const handleUpdateProject = async (e) => {
    e.preventDefault();
    const fd = new FormData();
    Object.keys(editingProject).forEach(key => fd.append(key, editingProject[key] ?? ''));
    try {
      const res = await fetch(`${API}?type=update_project`, { method: 'POST', body: fd });
      const data = await res.json();
      if (data.success) {
        showToast('Project updated!', 'success');
        setIsEditProjOpen(false);
        fetchProjects();
      } else { showToast('Update failed', 'error'); }
    } catch { showToast('Connection error', 'error'); }
  };

  // ── Shared UI helpers ─────────────────────────────────────────
  const inputCls = 'bg-gray-50 p-3 rounded-xl border-none outline-none ring-1 ring-gray-200 focus:ring-2 focus:ring-blue-500';

  return (
    <div className="bg-gray-100 min-h-screen w-full relative pb-10">
      {toast.show && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast({ ...toast, show: false })} />
      )}

      {/* Nav */}
      <nav className="bg-white border-b px-4 md:px-8 py-4 flex flex-col md:flex-row justify-between items-center sticky top-0 z-40 gap-4 shadow-sm">
        <div className="text-center md:text-left">
          <h1 className="text-xl md:text-2xl font-bold text-blue-900 leading-tight">Sevoke Realty</h1>
          <p className="text-[10px] md:text-xs font-bold text-gray-400 uppercase tracking-widest">Admin Panel</p>
        </div>
        <div className="flex w-full md:w-auto gap-2 flex-wrap justify-center">
          <button onClick={() => navigate('/add-property')} className="bg-blue-600 text-white px-4 py-2.5 rounded-xl font-bold text-sm shadow-md">+ Property</button>
          <button onClick={() => navigate('/add-project')} className="bg-indigo-600 text-white px-4 py-2.5 rounded-xl font-bold text-sm shadow-md">+ Project</button>
          <button onClick={() => { localStorage.removeItem('isLoggedIn'); navigate('/login'); }} className="bg-red-50 text-red-600 px-4 py-2.5 rounded-xl font-bold text-sm">Logout</button>
        </div>
      </nav>

      {/* Tabs */}
      <div className="px-4 md:px-8 pt-6 max-w-7xl mx-auto">
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('properties')}
            className={`px-5 py-2 rounded-xl font-bold text-sm transition-all ${activeTab === 'properties' ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-gray-500'}`}
          >
            Properties {allProperties.length > 0 && <span className="ml-1 opacity-70">({allProperties.length})</span>}
          </button>
          <button
            onClick={() => setActiveTab('projects')}
            className={`px-5 py-2 rounded-xl font-bold text-sm transition-all ${activeTab === 'projects' ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-gray-500'}`}
          >
            Projects {allProjects.length > 0 && <span className="ml-1 opacity-70">({allProjects.length})</span>}
          </button>
        </div>
      </div>

      <div className="px-4 md:px-8 w-full max-w-7xl mx-auto">

        {/* ═══ PROPERTIES TAB ═══ */}
        {activeTab === 'properties' && (
          <>
            <div className="mb-6 relative">
              <input type="text" placeholder="Search by name or location..." className="w-full p-4 pl-12 rounded-2xl border-none shadow-sm focus:ring-2 ring-blue-500 outline-none"
                value={propSearch} onChange={e => setPropSearch(e.target.value)} />
              <span className="absolute left-4 top-1/2 -translate-y-1/2 opacity-30 text-xl">🔍</span>
            </div>

            {/* Mobile cards */}
            <div className="grid grid-cols-1 gap-4 md:hidden">
              {filteredProperties.map(prop => (
                <div key={prop.id} className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100">
                  <div className="flex gap-4 mb-4">
                    <img src={`https://sevokerealty.in/${prop.image_url}`} className="w-20 h-20 object-cover rounded-2xl border" alt="property" />
                    <div className="flex-1">
                      <span className="text-[10px] font-bold text-blue-600 uppercase bg-blue-50 px-2 py-0.5 rounded-md">{prop.category}</span>
                      <h3 className="font-bold text-gray-900 mt-1">{prop.name}</h3>
                      <p className="text-xs text-gray-500 mt-0.5">📍 {prop.location}</p>
                      {prop.price_text && <p className="text-xs font-bold text-green-600 mt-0.5">{prop.price_text}</p>}
                    </div>
                  </div>
                  <div className="flex gap-2 border-t pt-3">
                    <button onClick={() => openEditProperty(prop)} className="flex-1 bg-blue-50 text-blue-600 py-2 rounded-xl font-bold text-xs">Modify</button>
                    <button onClick={() => handleDeleteProperty(prop.id)} className="flex-1 bg-red-50 text-red-500 py-2 rounded-xl font-bold text-xs">Delete</button>
                  </div>
                </div>
              ))}
              {filteredProperties.length === 0 && <p className="text-center text-gray-400 py-10">No properties found.</p>}
            </div>

            {/* Desktop table */}
            <div className="hidden md:block bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
              <table className="w-full text-left">
                <thead className="bg-gray-50 text-gray-400 uppercase text-[10px] font-black tracking-widest border-b">
                  <tr>
                    <th className="p-5">Image</th>
                    <th className="p-5">Property</th>
                    <th className="p-5">Price</th>
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
                        {prop.subcategory && <div className="text-xs text-gray-400 mt-0.5">{prop.subcategory}</div>}
                      </td>
                      <td className="p-5 text-sm font-bold text-green-700">{prop.price_text || '—'}</td>
                      <td className="p-5 capitalize">
                        <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-bold">{prop.category}</span>
                      </td>
                      <td className="p-5 text-right space-x-2">
                        <button onClick={() => openEditProperty(prop)} className="text-blue-600 font-bold hover:underline px-2 text-sm">Modify</button>
                        <button onClick={() => handleDeleteProperty(prop.id)} className="text-red-500 font-bold hover:underline px-2 text-sm">Delete</button>
                      </td>
                    </tr>
                  ))}
                  {filteredProperties.length === 0 && (
                    <tr><td colSpan="5" className="text-center text-gray-400 py-12">No properties found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* ═══ PROJECTS TAB ═══ */}
        {activeTab === 'projects' && (
          <>
            <div className="mb-6 relative">
              <input type="text" placeholder="Search by name or location..." className="w-full p-4 pl-12 rounded-2xl border-none shadow-sm focus:ring-2 ring-indigo-500 outline-none"
                value={projSearch} onChange={e => setProjSearch(e.target.value)} />
              <span className="absolute left-4 top-1/2 -translate-y-1/2 opacity-30 text-xl">🔍</span>
            </div>

            {/* Mobile cards */}
            <div className="grid grid-cols-1 gap-4 md:hidden">
              {filteredProjects.map(proj => (
                <div key={proj.id} className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100">
                  <div className="mb-3">
                    <span className="text-[10px] font-bold text-indigo-600 uppercase bg-indigo-50 px-2 py-0.5 rounded-md">{proj.category}</span>
                    <h3 className="font-bold text-gray-900 mt-1">{proj.name}</h3>
                    <p className="text-xs text-gray-500 mt-0.5">📍 {proj.location}</p>
                    <p className="text-xs text-gray-400">by {proj.developer}</p>
                    {proj.price && <p className="text-xs font-bold text-green-600 mt-0.5">{proj.price}</p>}
                    {proj.status && <span className="inline-block mt-1 text-[10px] font-bold bg-amber-50 text-amber-700 px-2 py-0.5 rounded-md uppercase">{proj.status}</span>}
                  </div>
                  <div className="flex gap-2 border-t pt-3">
                    <button onClick={() => openEditProject(proj)} className="flex-1 bg-indigo-50 text-indigo-600 py-2 rounded-xl font-bold text-xs">Modify</button>
                    <button onClick={() => handleDeleteProject(proj.id)} className="flex-1 bg-red-50 text-red-500 py-2 rounded-xl font-bold text-xs">Delete</button>
                  </div>
                </div>
              ))}
              {filteredProjects.length === 0 && <p className="text-center text-gray-400 py-10">No projects found.</p>}
            </div>

            {/* Desktop table */}
            <div className="hidden md:block bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
              <table className="w-full text-left">
                <thead className="bg-gray-50 text-gray-400 uppercase text-[10px] font-black tracking-widest border-b">
                  <tr>
                    <th className="p-5">Project</th>
                    <th className="p-5">Developer</th>
                    <th className="p-5">Price / Size</th>
                    <th className="p-5">Status</th>
                    <th className="p-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredProjects.map(proj => (
                    <tr key={proj.id} className="hover:bg-indigo-50/30 transition-colors">
                      <td className="p-5">
                        <div className="font-bold text-gray-900">{proj.name}</div>
                        <div className="text-xs text-gray-500">📍 {proj.location}</div>
                        <span className="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-md font-bold uppercase">{proj.category}</span>
                      </td>
                      <td className="p-5 text-sm text-gray-700">{proj.developer || '—'}</td>
                      <td className="p-5">
                        <div className="text-sm font-bold text-green-700">{proj.price || '—'}</div>
                        <div className="text-xs text-gray-400">{proj.size || ''}</div>
                      </td>
                      <td className="p-5">
                        {proj.status
                          ? <span className="px-3 py-1 bg-amber-50 text-amber-700 rounded-full text-xs font-bold capitalize">{proj.status}</span>
                          : '—'}
                      </td>
                      <td className="p-5 text-right space-x-2">
                        <button onClick={() => openEditProject(proj)} className="text-indigo-600 font-bold hover:underline px-2 text-sm">Modify</button>
                        <button onClick={() => handleDeleteProject(proj.id)} className="text-red-500 font-bold hover:underline px-2 text-sm">Delete</button>
                      </td>
                    </tr>
                  ))}
                  {filteredProjects.length === 0 && (
                    <tr><td colSpan="5" className="text-center text-gray-400 py-12">No projects found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* ═══ EDIT PROPERTY MODAL ═══ */}
      {isEditPropOpen && editingProperty && (
        <div className="fixed inset-0 bg-blue-900/40 backdrop-blur-sm flex items-end md:items-center justify-center z-[110] p-0 md:p-4">
          <div className="bg-white rounded-t-3xl md:rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom md:zoom-in duration-300">
            <div className="p-6 border-b flex justify-between items-center sticky top-0 bg-white z-10">
              <h2 className="text-lg font-black text-blue-900 uppercase">Edit Property</h2>
              <button onClick={() => setIsEditPropOpen(false)} className="text-gray-400 text-3xl">&times;</button>
            </div>
            <form onSubmit={handleUpdateProperty} className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <input className={inputCls} placeholder="Name" value={editingProperty.name || ''} onChange={e => setEditingProperty({ ...editingProperty, name: e.target.value })} required />
              <input className={inputCls} placeholder="Location" value={editingProperty.location || ''} onChange={e => setEditingProperty({ ...editingProperty, location: e.target.value })} required />
              <input className={inputCls} placeholder="Price (e.g. ₹50L)" value={editingProperty.price_text || ''} onChange={e => setEditingProperty({ ...editingProperty, price_text: e.target.value })} />
              <input className={inputCls} placeholder="Type (e.g. resell/fresh)" value={editingProperty.type || ''} onChange={e => setEditingProperty({ ...editingProperty, type: e.target.value })} />
              {/* subcategory replaces developer */}
              <input className={inputCls} placeholder="Subcategory (e.g. Developer name)" value={editingProperty.subcategory || ''} onChange={e => setEditingProperty({ ...editingProperty, subcategory: e.target.value })} />
              {/* listing_type replaces availableOption */}
              <input className={inputCls} placeholder="Listing type (e.g. 2BHK/3BHK)" value={editingProperty.listing_type || ''} onChange={e => setEditingProperty({ ...editingProperty, listing_type: e.target.value })} />
              <input className={inputCls} placeholder="Area (sqft)" value={editingProperty.area_sqft || ''} onChange={e => setEditingProperty({ ...editingProperty, area_sqft: e.target.value })} />
              <select className={inputCls} value={editingProperty.category || 'residential'} onChange={e => setEditingProperty({ ...editingProperty, category: e.target.value })}>
                <option value="residential">Residential</option>
                <option value="commercial">Commercial</option>
              </select>
              <textarea className={`md:col-span-2 h-24 ${inputCls}`} placeholder="Description" value={editingProperty.description || ''} onChange={e => setEditingProperty({ ...editingProperty, description: e.target.value })} />
              <button type="submit" className="md:col-span-2 bg-blue-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-blue-200">SAVE CHANGES</button>
            </form>
          </div>
        </div>
      )}

      {/* ═══ EDIT PROJECT MODAL ═══ */}
      {isEditProjOpen && editingProject && (
        <div className="fixed inset-0 bg-indigo-900/40 backdrop-blur-sm flex items-end md:items-center justify-center z-[110] p-0 md:p-4">
          <div className="bg-white rounded-t-3xl md:rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom md:zoom-in duration-300">
            <div className="p-6 border-b flex justify-between items-center sticky top-0 bg-white z-10">
              <h2 className="text-lg font-black text-indigo-900 uppercase">Edit Project</h2>
              <button onClick={() => setIsEditProjOpen(false)} className="text-gray-400 text-3xl">&times;</button>
            </div>
            <form onSubmit={handleUpdateProject} className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <input className={inputCls} placeholder="Project Name" value={editingProject.name || ''} onChange={e => setEditingProject({ ...editingProject, name: e.target.value })} required />
              <input className={inputCls} placeholder="Developer" value={editingProject.developer || ''} onChange={e => setEditingProject({ ...editingProject, developer: e.target.value })} />
              <input className={inputCls} placeholder="Location" value={editingProject.location || ''} onChange={e => setEditingProject({ ...editingProject, location: e.target.value })} />
              <input className={inputCls} placeholder="Price" value={editingProject.price || ''} onChange={e => setEditingProject({ ...editingProject, price: e.target.value })} />
              <input className={inputCls} placeholder="Size (e.g. 1200 sqft)" value={editingProject.size || ''} onChange={e => setEditingProject({ ...editingProject, size: e.target.value })} />
              <input className={inputCls} placeholder="Options (e.g. 2BHK, 3BHK)" value={editingProject.options || ''} onChange={e => setEditingProject({ ...editingProject, options: e.target.value })} />
              <input className={inputCls} placeholder="Category" value={editingProject.category || ''} onChange={e => setEditingProject({ ...editingProject, category: e.target.value })} />
              <input className={inputCls} placeholder="Type" value={editingProject.type || ''} onChange={e => setEditingProject({ ...editingProject, type: e.target.value })} />
              <input className={inputCls} placeholder="Status (e.g. Under Construction)" value={editingProject.status || ''} onChange={e => setEditingProject({ ...editingProject, status: e.target.value })} />
              <textarea className={`md:col-span-2 h-24 ${inputCls}`} placeholder="Details" value={editingProject.details || ''} onChange={e => setEditingProject({ ...editingProject, details: e.target.value })} />
              <button type="submit" className="md:col-span-2 bg-indigo-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-indigo-200">SAVE CHANGES</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;