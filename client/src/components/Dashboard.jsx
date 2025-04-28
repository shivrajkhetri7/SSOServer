import "../style/dashboard.css";
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import axios from 'axios';

const Dashboard = () => {
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      toast.error('Please log in first!');
      navigate('/');
    } else {
      setUserData({ name: 'Client 1' });
    }
  }, [navigate]);

  const handleLogout = async () => {
    try {
      const idTokenHint = localStorage.getItem('id_token');
      // const tenantId = localStorage.getItem('x_tenant_id') || sessionStorage.getItem('x_tenant_id');

      // Clear storage first to prevent race conditions
      localStorage.clear();
      sessionStorage.clear();

      // Then make the logout API call
      await axios.post('https://localhost:4004/api/v1/oauth/logout',
        {
          id_token_hint: idTokenHint,
          client_id: CLIENT
        },
        {
          withCredentials: true,
          headers: {
            'x-tenant-id': tenantId,
            'Content-Type': 'application/json'
          }
        }
      );

      toast.success('Logged out successfully!');
      navigate('/');
    } catch (error) {
      console.error('Logout failed:', error);
      toast.error(error.response?.data?.error_description || 'Logout failed. Please try again.');
    }
  };

  // Example of making an authenticated API call with tenant ID
  const fetchData = async () => {
    try {
      const response = await axios.get('https://localhost:4004/api/v1/some-endpoint', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'x-tenant-id': tenantId
        }
      });
      // Handle response data
    } catch (error) {
      console.error('API call failed:', error);
    }
  };

  return (
    <div className='container'>
      <h1>Welcome to the Dashboard</h1>
      <p>{userData ? `Hello, ${userData.name}` : 'Loading...'}</p>
      <p>Tenant ID: {tenantId || 'Not specified'}</p>
      <button onClick={handleLogout} className="logout-btn">Logout</button>
    </div>
  );
};

export default Dashboard;