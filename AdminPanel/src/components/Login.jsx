import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData();
    formData.append('username', credentials.username);
    formData.append('password', credentials.password);

    try {
      const res = await fetch('https://sevokerealty.in/index.php?type=login', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem('isLoggedIn', 'true');
        navigate('/dashboard');
      } else {
        alert(data.message || 'Invalid credentials.');
      }
    } catch (err) {
      alert('Login failed. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <form onSubmit={handleLogin} className="bg-white p-8 rounded-2xl shadow-xl w-96">
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-bold text-blue-900">Sevoke Realty</h2>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Admin Panel</p>
        </div>
        <input
          type="text"
          placeholder="Username"
          className="w-full p-3 mb-4 bg-gray-50 rounded-xl border-none outline-none ring-1 ring-gray-200 focus:ring-2 focus:ring-blue-500"
          onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
          required
        />
        <input
          type="password"
          placeholder="Password"
          className="w-full p-3 mb-6 bg-gray-50 rounded-xl border-none outline-none ring-1 ring-gray-200 focus:ring-2 focus:ring-blue-500"
          onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
          required
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition-all disabled:opacity-60"
        >
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>
    </div>
  );
};

export default Login;