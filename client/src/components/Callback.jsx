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
      console.log('params',params)
      const code = params.get('code');
      const error = params.get('error');

      if (error) {
        toast.error(error);
        navigate('/');
        return;
      }

      if (code) {
        try {
          // Retrieve the code_verifier from sessionStorage
          const codeVerifier = sessionStorage.getItem('pkce_verifier');

          // if (!codeVerifier) {
          //   toast.error('PKCE verifier missing from session');
          //   return navigate('/');
          // }

          const response = await axios.post('http://localhost:3000/oauth/token', {
            code,
            grant_type: 'authorization_code',
            client_id: import.meta.env.VITE_CLIENT_ID,
            redirect_uri: window.location.origin + '/callback',
            code_verifier: codeVerifier,
          }, {
            withCredentials: true,
          });

          sessionStorage.removeItem('pkce_verifier'); 

          localStorage.setItem('access_token', response.data.access_token);
          localStorage.setItem('refresh_token', response.data.refresh_token);
          localStorage.setItem('user', JSON.stringify(response.data.user));

          navigate('/dashboard');
        } catch (err) {
          console.error('Callback error:', err);
          toast.error('Authentication failed');
          navigate('/');
        }
      }
    };

    handleCallback();
  }, []);

  return <div>Processing authentication...</div>;
};

export default Callback;
