import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import imageCompression from 'browser-image-compression';
import Toast from './Toast';

const Add_Property = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [property, setProperty] = useState({
    name: '', location: '', category: 'residential', type: '',
    price_text: '', area_sqft: '', developer: '', availableOption: '', description: ''
  });
  const [features, setFeatures] = useState([]);
  const [currentFeature, setCurrentFeature] = useState('');
  const [files, setFiles] = useState([]);
  const [mainIndex, setMainIndex] = useState(0);
  const [toast, setToast] = useState({ show: false, message: '', type: '' });

  const showToast = (message, type) => {
    setToast({ show: true, message, type });
  };

  useEffect(() => {
    // Cleanup function
    return () => {
      files.forEach(fileObj => URL.revokeObjectURL(fileObj.preview));
    };
  }, [files]);

  const handleFileSelection = async (e) => {
    const selectedFiles = Array.from(e.target.files);
    const options = { maxSizeMB: 0.8, maxWidthOrHeight: 1200, useWebWorker: true };
    setLoading(true);

    try {
      const processedFiles = await Promise.all(
        selectedFiles.map(async (file) => {
          const compressed = await imageCompression(file, options);
          return {
            file: compressed,
            preview: URL.createObjectURL(compressed) // Generate URL once here
          };
        })
      );

      // If you want to append to existing files instead of replacing:
      // setFiles(prev => [...prev, ...processedFiles]);
      setFiles(processedFiles);
    } catch (error) {
      showToast("Image error", "error");
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

  const removeFeature = (index) => {
    setFeatures(features.filter((_, i) => i !== index));
  };

  const removeImage = (e, index) => {
    e.stopPropagation(); // Prevents setting this image as "Main" when deleting

    setFiles((prev) => {
      // 1. Revoke the URL to prevent memory leaks
      URL.revokeObjectURL(prev[index].preview);

      // 2. Filter out the deleted image
      const newFiles = prev.filter((_, i) => i !== index);

      // 3. Adjust mainIndex so it doesn't point to an empty index
      if (mainIndex === index) {
        setMainIndex(0);
      } else if (mainIndex > index) {
        setMainIndex(mainIndex - 1);
      }

      return newFiles;
    });
  };

  const handleSubmit = async (e) => {
  e.preventDefault();
  if (files.length === 0) {
    showToast("Please upload at least one image", "error");
    return;
  }

  setLoading(true);
  const formData = new FormData();

  // Append text fields
  Object.keys(property).forEach(key => formData.append(key, property[key]));
  
  // Append features
  features.forEach(f => formData.append('features[]', f));

  // Append images correctly
  files.forEach((fileObj) => {
    formData.append('images[]', fileObj.file);
  });

  // CRITICAL: Ensure main_index is sent so PHP knows which one is 'is_main'
  formData.append('main_index', mainIndex);
  console.log("Files being sent:", formData.getAll('images[]'));
  console.log("Main Index index:", formData.get('main_index'));
  try {
    const res = await fetch('https://sevokerealty.in/api.php?type=add_property', { 
      method: 'POST', 
      body: formData 
    });
    const data = await res.json();
    if (data.success) {
      showToast("Property Added Successfully!", "success");
      setTimeout(() => navigate('/dashboard'), 1500);
    } else {
      showToast(data.error || "Upload failed", "error");
    }
  } catch (err) {
    showToast("Server error", "error");
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="bg-gray-100 min-h-screen w-full pb-10">
      {toast.show && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast({ ...toast, show: false })} />
      )}

      <nav className="bg-white border-b px-4 md:px-8 py-4 flex justify-between items-center shadow-sm w-full">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-blue-900 leading-tight">Add Listing</h1>
          <p className="text-[10px] md:text-sm font-semibold text-gray-500 uppercase tracking-widest">Sevoke Realty</p>
        </div>
        <button onClick={() => navigate('/dashboard')} className="bg-gray-100 text-gray-600 px-4 py-2 rounded-xl font-bold text-sm shadow-sm hover:bg-gray-200 transition-all">← Back</button>
      </nav>

      <div className="p-4 md:p-8 w-full max-w-5xl mx-auto">
        <div className="bg-white p-6 md:p-10 rounded-3xl shadow-xl animate-in slide-in-from-top duration-500">
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            <input className="border-none bg-gray-50 p-4 rounded-2xl ring-1 ring-gray-200 focus:ring-2 ring-blue-500 outline-none" placeholder="Property Name" value={property.name} onChange={e => setProperty({ ...property, name: e.target.value })} required />
            <input className="border-none bg-gray-50 p-4 rounded-2xl ring-1 ring-gray-200 focus:ring-2 ring-blue-500 outline-none" placeholder="Location" value={property.location} onChange={e => setProperty({ ...property, location: e.target.value })} required />

            <div className="md:col-span-2 border-t pt-4">
              <label className="block mb-2 font-black text-[10px] uppercase text-gray-400 ml-1">Key Features</label>
              <div className="flex-wrap md:flex gap-2">
                <input className="flex-1 bg-gray-50 p-3 rounded-2xl outline-none ring-1 ring-gray-200 focus:ring-2 ring-blue-500" placeholder="e.g. Near Market" value={currentFeature} onChange={e => setCurrentFeature(e.target.value)} />
                <button type="button" onClick={addFeature} className="bg-blue-600 text-white px-6 rounded-2xl font-bold mt-2">Add</button>
              </div>
              <div className="flex flex-wrap gap-2 mt-3">
                {features.map((f, i) => (
                  <span key={i} className="bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full text-xs font-bold flex items-center shadow-sm border border-blue-100">
                    {f} <button type="button" onClick={() => removeFeature(i)} className="ml-2 text-red-400 hover:text-red-600 text-lg">&times;</button>
                  </span>
                ))}
              </div>
            </div>

            <select className="bg-gray-50 p-4 rounded-2xl border-none ring-1 ring-gray-200 focus:ring-2 ring-blue-500 outline-none" value={property.category} onChange={e => setProperty({ ...property, category: e.target.value })}>
              <option value="residential">Residential</option>
              <option value="commercial">Commercial</option>
            </select>
            <input className="bg-gray-50 p-4 rounded-2xl border-none ring-1 ring-gray-200" placeholder="Type (e.g. resell/fresh)" value={property.type} onChange={e => setProperty({ ...property, type: e.target.value })} />
            <input className="bg-gray-50 p-4 rounded-2xl border-none ring-1 ring-gray-200" placeholder="Price (e.g. ₹50L)" value={property.price_text} onChange={e => setProperty({ ...property, price_text: e.target.value })} />
            <input className="bg-gray-50 p-4 rounded-2xl border-none ring-1 ring-gray-200" type="number" placeholder="Area (sqft)" value={property.area_sqft} onChange={e => setProperty({ ...property, area_sqft: e.target.value })} />
            <input className="bg-gray-50 p-4 rounded-2xl border-none ring-1 ring-gray-200" placeholder="Developer name" value={property.developer} onChange={e => setProperty({ ...property, developer: e.target.value })} />
            <input className="bg-gray-50 p-4 rounded-2xl border-none ring-1 ring-gray-200" placeholder="Available options (eg 2bhk/3bhk)" value={property.availableOption} onChange={e => setProperty({ ...property, availableOption: e.target.value })} />
            <textarea className="md:col-span-2 bg-gray-50 p-4 rounded-2xl h-32 border-none ring-1 ring-gray-200 focus:ring-2 ring-blue-500 outline-none" placeholder="Description" value={property.description} onChange={e => setProperty({ ...property, description: e.target.value })} />

            <div className="md:col-span-2 bg-blue-50/50 p-6 rounded-3xl border-2 border-dashed border-blue-200">
              <div className="text-center mb-4">
                <label className="block font-black text-blue-900 uppercase tracking-widest text-xs">Upload Images</label>
                <p className="text-[10px] text-blue-500 font-bold mt-1 uppercase italic">
                  Please click on an image to select it as the MAIN image
                </p>
              </div>

              <input
                type="file"
                multiple
                onChange={handleFileSelection}
                className="mb-6 w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-blue-600 file:text-white cursor-pointer"
              />

              <div className="flex gap-4 overflow-x-auto pb-4 px-2 custom-scrollbar">
                {files.map((fileData, idx) => (
                  <div
                    key={idx}
                    onClick={() => setMainIndex(idx)}
                    className={`relative shrink-0 cursor-pointer w-28 h-28 rounded-2xl overflow-hidden border-4 transition-all duration-300 
      ${mainIndex === idx ? 'border-blue-600 scale-105' : 'border-white opacity-60'}`}
                  >
                    <img
                      src={fileData.preview} // ...so that this 'fileData' now exists!
                      className="w-full h-full object-cover"
                      alt={`preview-${idx}`}
                    />

                    {/* The rest of your delete button and badges */}
                    <button
                      onClick={(e) => removeImage(e, idx)}
                      className="absolute top-1 right-1 z-20 bg-red-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs shadow-md hover:bg-red-600 transition-colors"
                    >
                      ✕
                    </button>

                    {/* Visual Badge for Main Image */}
                    {mainIndex === idx && (
                      <div className="absolute inset-0 bg-blue-600/20 flex items-center justify-center">
                        <div className="bg-blue-600 text-white text-[10px] font-black px-2 py-1 rounded-lg shadow-lg uppercase tracking-tighter flex items-center gap-1">
                          <span>★</span> Main Image
                        </div>
                      </div>
                    )}

                    {/* Small selection ring for non-selected images on hover */}
                    {mainIndex !== idx && (
                      <div className="absolute inset-0 bg-black/5 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="text-white text-xs font-bold bg-black/20 px-2 py-1 rounded-lg">Set Main</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <button disabled={loading} type="submit" className="md:col-span-2 bg-green-600 text-white py-4 rounded-2xl font-black text-lg shadow-xl hover:bg-green-700 transition-all active:scale-95">
              {loading ? "PROCESSING..." : "PUBLISH PROPERTY"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Add_Property;