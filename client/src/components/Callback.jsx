import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import axios from 'axios';

const Callback = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      const params = new URLSearchParams(location.search);
      const code = params.get('code');
      const error = params.get('error');
      const state = params.get('state');

      if (error) {
        toast.error(error);
        navigate('/');
        return;
      }

      if (code) {
        try {
          // Retrieve the code_verifier and tenant ID from sessionStorage
          const codeVerifier = sessionStorage.getItem('pkce_verifier');
          const tenantId = sessionStorage.getItem('x_tenant_id');

          const response = await axios.post(
            'https://localhost:4004/api/v1/oauth/token',
            {
              code,
              grant_type: 'authorization_code',
              client_id: import.meta.env.VITE_CLIENT_ID,
              redirect_uri: window.location.origin + '/callback',
              code_verifier: codeVerifier,
              state, // Include state in the request
            },
            {
              withCredentials: true,
              headers: {
                'x-tenant-id': import.meta.env.VITE_CLIENT_ID || '', // Add tenant ID to headers
                'Content-Type': 'application/json',
              },
            }
          );

          // Clean up session storage
          sessionStorage.removeItem('pkce_verifier');
          sessionStorage.removeItem('x_tenant_id');

          // Store tokens and user data
          localStorage.setItem('access_token', response.data.access_token);
          localStorage.setItem('refresh_token', response.data.refresh_token);
          localStorage.setItem('id_token',response.data.id_token)
          localStorage.setItem('user', JSON.stringify(response.data.user));

          navigate('/dashboard');
        } catch (err) {
          console.error('Callback error:', err);
          toast.error(err.response?.data?.error_description || 'Authentication failed');
          navigate('/');
        }
      }
    };

    handleCallback();

  }, [location, navigate]);

  return <div>Processing authentication...</div>;
};

export default Callback;