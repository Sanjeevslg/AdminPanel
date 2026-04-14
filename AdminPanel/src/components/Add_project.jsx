import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import imageCompression from 'browser-image-compression';
import Toast from './Toast';
import { API_URL as API } from '../config/api';

const Add_Project = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  // Matches the `projects` table: name, developer, location, price, size, category, type, options, status, details
  const [project, setProject] = useState({
    name: '',
    developer: '',
    location: '',
    price: '',
    size: '',
    category: 'residential',
    type: '',
    options: '',
    status: '',
    details: '',
  });

  const [features, setFeatures] = useState([]);
  const [currentFeature, setCurrentFeature] = useState('');
  const [files, setFiles] = useState([]);
  const [mainIndex, setMainIndex] = useState(0);
  const [toast, setToast] = useState({ show: false, message: '', type: '' });

  const showToast = (message, type) => setToast({ show: true, message, type });

  useEffect(() => {
    return () => { files.forEach(f => URL.revokeObjectURL(f.preview)); };
  }, [files]);

  const handleFileSelection = async (e) => {
    const selectedFiles = Array.from(e.target.files);
    const options = { maxSizeMB: 0.8, maxWidthOrHeight: 1200, useWebWorker: true };
    setLoading(true);
    try {
      const processed = await Promise.all(
        selectedFiles.map(async (file) => {
          const compressed = await imageCompression(file, options);
          return { file: compressed, preview: URL.createObjectURL(compressed) };
        })
      );
      setFiles(processed);
    } catch {
      showToast('Image compression failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const addFeature = () => {
    if (currentFeature.trim()) {
      setFeatures([...features, currentFeature.trim()]);
      setCurrentFeature('');
    }
  };

  const removeFeature = (index) => setFeatures(features.filter((_, i) => i !== index));

  const removeImage = (e, index) => {
    e.stopPropagation();
    setFiles(prev => {
      URL.revokeObjectURL(prev[index].preview);
      const next = prev.filter((_, i) => i !== index);
      if (mainIndex === index) setMainIndex(0);
      else if (mainIndex > index) setMainIndex(mainIndex - 1);
      return next;
    });
  };

  const resetForm = () => {
    setProject({ name: '', developer: '', location: '', price: '', size: '', category: 'residential', type: '', options: '', status: '', details: '' });
    setFeatures([]);
    files.forEach(f => URL.revokeObjectURL(f.preview));
    setFiles([]);
    setMainIndex(0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (files.length === 0) return showToast('Please upload at least one image', 'error');

    setLoading(true);
    const formData = new FormData();

    Object.keys(project).forEach(key => formData.append(key, project[key]));
    features.forEach(f => formData.append('features[]', f));
    files.forEach(f => formData.append('images[]', f.file));
    formData.append('main_index', mainIndex);

    try {
      const res = await fetch(`${API}?type=add_project`, { method: 'POST', body: formData });
      const rawResponse = await res.text();
      try {
        const data = JSON.parse(rawResponse);
        if (data.success) {
          showToast('Project Added Successfully!', 'success');
          resetForm();
          setTimeout(() => navigate('/dashboard'), 1500);
        } else {
          showToast(data.error || 'Upload failed', 'error');
        }
      } catch {
        console.error('Server sent invalid JSON:', rawResponse);
        showToast('Project added, but server response was unexpected.', 'error');
        setTimeout(() => navigate('/dashboard'), 2000);
      }
    } catch {
      showToast('Connection error', 'error');
    } finally {
      setLoading(false);
    }
  };

  const set = (field) => (e) => setProject({ ...project, [field]: e.target.value });
  const inputCls = 'bg-gray-50 p-4 rounded-2xl border-none ring-1 ring-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none';

  return (
    <div className="bg-gray-100 min-h-screen w-full pb-10">
      {toast.show && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast({ ...toast, show: false })} />
      )}

      <nav className="bg-white border-b px-4 md:px-8 py-4 flex justify-between items-center shadow-sm w-full">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-indigo-900 leading-tight">Add Project</h1>
          <p className="text-[10px] md:text-sm font-semibold text-gray-500 uppercase tracking-widest">Sevoke Realty</p>
        </div>
        <button onClick={() => navigate('/dashboard')} className="bg-gray-100 text-gray-600 px-4 py-2 rounded-xl font-bold text-sm shadow-sm hover:bg-gray-200 transition-all">← Back</button>
      </nav>

      <div className="p-4 md:p-8 w-full max-w-5xl mx-auto">
        <div className="bg-white p-6 md:p-10 rounded-3xl shadow-xl animate-in slide-in-from-top duration-500">
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">

            <input className={inputCls} placeholder="Project Name" value={project.name} onChange={set('name')} required />
            <input className={inputCls} placeholder="Developer" value={project.developer} onChange={set('developer')} />
            <input className={inputCls} placeholder="Location" value={project.location} onChange={set('location')} required />
            <input className={inputCls} placeholder="Price (e.g. ₹1.2Cr)" value={project.price} onChange={set('price')} />
            <input className={inputCls} placeholder="Size (e.g. 1200 sqft)" value={project.size} onChange={set('size')} />
            <input className={inputCls} placeholder="Options (e.g. 2BHK, 3BHK, 4BHK)" value={project.options} onChange={set('options')} />

            <select className={inputCls} value={project.category} onChange={set('category')}>
              <option value="residential">Residential</option>
              <option value="commercial">Commercial</option>
              <option value="residential, commercial">Mixed Use</option>
            </select>
            <input className={inputCls} placeholder="Type (e.g. apartment / villa)" value={project.type} onChange={set('type')} />

            <input
              className={`md:col-span-2 ${inputCls}`}
              placeholder="Status (e.g. Under Construction / Ready to Move)"
              value={project.status}
              onChange={set('status')}
            />

            {/* Features */}
            <div className="md:col-span-2 border-t pt-4">
              <label className="block mb-2 font-black text-[10px] uppercase text-gray-400 ml-1">Key Features</label>
              <div className="flex-wrap md:flex gap-2">
                <input
                  className="flex-1 bg-gray-50 p-3 rounded-2xl outline-none ring-1 ring-gray-200 focus:ring-2 focus:ring-indigo-500"
                  placeholder="e.g. Rooftop Pool"
                  value={currentFeature}
                  onChange={e => setCurrentFeature(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addFeature())}
                />
                <button type="button" onClick={addFeature} className="bg-indigo-600 text-white px-6 rounded-2xl font-bold mt-2">Add</button>
              </div>
              <div className="flex flex-wrap gap-2 mt-3">
                {features.map((f, i) => (
                  <span key={i} className="bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-full text-xs font-bold flex items-center shadow-sm border border-indigo-100">
                    {f}
                    <button type="button" onClick={() => removeFeature(i)} className="ml-2 text-red-400 hover:text-red-600 text-lg">&times;</button>
                  </span>
                ))}
              </div>
            </div>

            <textarea className={`md:col-span-2 h-32 ${inputCls}`} placeholder="Project details / description" value={project.details} onChange={set('details')} />

            {/* Image upload */}
            <div className="md:col-span-2 bg-indigo-50/50 p-6 rounded-3xl border-2 border-dashed border-indigo-200">
              <div className="text-center mb-4">
                <label className="block font-black text-indigo-900 uppercase tracking-widest text-xs">Upload Images</label>
                <p className="text-[10px] text-indigo-500 font-bold mt-1 uppercase italic">Click an image to set it as the MAIN image</p>
              </div>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileSelection}
                className="mb-6 w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-indigo-600 file:text-white cursor-pointer"
              />
              <div className="flex gap-4 overflow-x-auto pb-4 px-2">
                {files.map((fileData, idx) => (
                  <div
                    key={idx}
                    onClick={() => setMainIndex(idx)}
                    className={`relative shrink-0 cursor-pointer w-28 h-28 rounded-2xl overflow-hidden border-4 transition-all duration-300
                      ${mainIndex === idx ? 'border-indigo-600 scale-105' : 'border-white opacity-60'}`}
                  >
                    <img src={fileData.preview} className="w-full h-full object-cover" alt={`preview-${idx}`} />
                    <button
                      onClick={(e) => removeImage(e, idx)}
                      className="absolute top-1 right-1 z-20 bg-red-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs shadow-md hover:bg-red-600 transition-colors"
                    >✕</button>
                    {mainIndex === idx && (
                      <div className="absolute inset-0 bg-indigo-600/20 flex items-center justify-center">
                        <div className="bg-indigo-600 text-white text-[10px] font-black px-2 py-1 rounded-lg shadow-lg uppercase tracking-tighter flex items-center gap-1">
                          <span>★</span> Main
                        </div>
                      </div>
                    )}
                    {mainIndex !== idx && (
                      <div className="absolute inset-0 bg-black/5 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="text-white text-xs font-bold bg-black/20 px-2 py-1 rounded-lg">Set Main</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <button
              disabled={loading}
              type="submit"
              className="md:col-span-2 bg-indigo-600 text-white py-4 rounded-2xl font-black text-lg shadow-xl hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-60"
            >
              {loading ? 'PROCESSING...' : 'PUBLISH PROJECT'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Add_Project;