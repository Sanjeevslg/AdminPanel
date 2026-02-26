import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('username', credentials.username);
    formData.append('password', credentials.password);

    try {
      const res = await fetch('https://sevokerealty.in/api.php?type=login', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem('isLoggedIn', 'true');
        navigate('/dashboard');
      } else {
        alert(data.message);
      }
    } catch (err) {
      alert("Login failed. Check console.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <form onSubmit={handleLogin} className="bg-white p-8 rounded-lg shadow-md w-96">
        <h2 className="text-2xl font-bold mb-6 text-center text-blue-600">Sevoke Realty Admin</h2>
        <input 
          type="text" placeholder="Username" 
          className="w-full p-2 mb-4 border rounded"
          onChange={(e) => setCredentials({...credentials, username: e.target.value})}
        />
        <input 
          type="password" placeholder="Password" 
          className="w-full p-2 mb-6 border rounded"
          onChange={(e) => setCredentials({...credentials, password: e.target.value})}
        />
        <button className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">Login</button>
      </form>
    </div>
  );
};

export default Login;