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
  
      await axios.post('http://localhost:3000/oauth/logout', {
        id_token_hint: idTokenHint
      }, {
        withCredentials: true,
      });
  
      localStorage.clear();
      sessionStorage.clear();
  
      toast.success('Logged out successfully!');
      navigate('/');
    } catch (error) {
      console.error('Logout failed:', error);
      toast.error('Logout failed. Please try again.');
    }
  };
  
  return (
    <div className='container'>
      <h1>Welcome to the Dashboard</h1>
      <p>{userData ? `Hello, ${userData.name}` : 'Loading...'}</p>
      <button onClick={handleLogout} className="logout-btn">Logout</button>
    </div>
  );
};

export default Dashboard;
