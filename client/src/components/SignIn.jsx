import '../style/signin.css';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import axios from 'axios';
import { toast } from 'react-toastify';
import { generateCodeVerifier, generateCodeChallenge } from "../utils/pkceUtils";

const SignIn = () => {

    const CLIENT = import.meta.env.VITE_CLIENT_ID;
    const REDIRECT_URI = import.meta.env.VITE_REDIRECT_URI;
    const navigate = useNavigate();
    const [userDetails, setUserDetails] = useState({});
    const [error, setError] = useState('');
    const [redirectTo, setRedirectTo] = useState(REDIRECT_URI);
    const [idpParams, setIdpParams] = useState({
        client_id: CLIENT,
        state: ''
    });

    // Extract query parameters
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const redirectParam = params.get("redirect_uri");
        const clientId = params.get("client_id");
        const state = params.get("state");

        if (redirectParam) {
            setRedirectTo(redirectParam);
        }

        if (clientId && state) {
            setIdpParams({
                client_id: clientId,
                state: state
            });
        }
    }, []);

    const handleChange = (event) => {
        setUserDetails({ ...userDetails, [event?.target?.name]: event?.target?.value });
    };

    const loginPayloadValidation = async (user) => {
        if (!user?.username) throw new Error("Username is required");
        if (!user?.password) throw new Error("Password is required");
        return true;
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        try {
            await loginPayloadValidation(userDetails);

            const headers = { 'Content-Type': "application/json" };
            const response = await axios.post('http://localhost:3000/signin', userDetails, { headers });

            if (response?.status === 200) {
                localStorage.setItem('authToken', response?.data.token);
                toast.success('Signed in successfully');

                if (redirectTo) {
                    window.location.href = `${redirectTo}?token=${response?.data.token}`;
                } else {
                    navigate('/dashboard');
                }
            }
        } catch (error) {
            toast.error(error.message || 'Something went wrong');
            setError(error.message);
        }
    };

    // const handleIdpLogin = async () => {
    //     try {
    //         // Step 1: Generate PKCE code verifier and challenge
    //         const codeVerifier = generateCodeVerifier();
    //         const codeChallenge = await generateCodeChallenge(codeVerifier);
    //         sessionStorage.setItem("pkce_verifier", codeVerifier);
    
    //         // Step 2: Check if a session exists
    //         await axios.get('http://localhost:3000/oauth/check-session', {
    //             withCredentials: true
    //         });
    
    //         // Step 3: Construct the authorize URL
    //         const callbackUrl = `${window.location.origin}/callback`;
    //         const state = idpParams.state || crypto.randomUUID();
    //         sessionStorage.setItem("oauth_state", state); // store for later validation
    
    //         const authUrl = new URL("http://localhost:3000/oauth/authorize");
    //         authUrl.searchParams.set("response_type", "code");
    //         authUrl.searchParams.set("client_id", idpParams.client_id);
    //         authUrl.searchParams.set("redirect_uri", callbackUrl);
    //         authUrl.searchParams.set("scope", "openid profile email");
    //         authUrl.searchParams.set("state", state);
    //         authUrl.searchParams.set("code_challenge", codeChallenge);
    //         authUrl.searchParams.set("code_challenge_method", "S256");
    
    //         // Redirect to OAuth server
    //         window.location.href = authUrl.toString();
    
    //     } catch (error) {
    //         console.error("Session check failed. Redirecting to login instead...", error);
    
    //         // fallback: redirect directly to login
    //         const callbackUrl = `${window.location.origin}/callback`;
    //         const loginUrl = new URL("http://localhost:3000/oauth/login");
    //         loginUrl.searchParams.set("client_id", idpParams.client_id);
    //         loginUrl.searchParams.set("redirect_uri", callbackUrl);
    //         loginUrl.searchParams.set("state", idpParams.state || crypto.randomUUID());
    
    //         window.location.href = loginUrl.toString();
    //     }
    // };
    

    // TODO : this is for backend Direct URL redirection 
    //! SO PLEASE KEEP THIS CODE AND MAKE CHANGE AT BACKEND AS WELL
    
    const handleIdpLogin = async () => {
        try {
          // Step 1: Generate PKCE code verifier and challenge
          const codeVerifier = generateCodeVerifier();
          const codeChallenge = await generateCodeChallenge(codeVerifier);
      
          // Store the verifier temporarily (you’ll use it on the callback page)
          sessionStorage.setItem("pkce_verifier", codeVerifier);
      
          // Step 2: Check session from the server
          const response = await axios.get('http://localhost:3000/oauth/check-session', {
            withCredentials: true
          });
      
          // Step 3: Build the authorization URL
          const callbackUrl = `${window.location.origin}/callback`;
          const baseAuthUrl = 'http://localhost:3000/oauth/authorize';
          const state = idpParams.state || crypto.randomUUID();
      
          const authUrl = new URL(baseAuthUrl);
          authUrl.searchParams.set('response_type', 'code');
          authUrl.searchParams.set('client_id', idpParams.client_id);
          authUrl.searchParams.set('redirect_uri', callbackUrl);
          authUrl.searchParams.set('scope', 'openid profile email');
          authUrl.searchParams.set('state', state);
          authUrl.searchParams.set('code_challenge', codeChallenge);
          authUrl.searchParams.set('code_challenge_method', 'S256');
      
          // Redirect the user
          window.location.href = authUrl.toString();
      
        } catch (error) {
          console.error('Session check failed, falling back to login:', error);
      
          const callbackUrl = `${window.location.origin}/callback`;
          const loginUrl = `http://localhost:3000/oauth/login?client_id=${idpParams.client_id}&redirect_uri=${encodeURIComponent(callbackUrl)}&state=${idpParams.state}`;
      
          window.location.href = loginUrl;
        }
      };
      
    return (
        <div className='sign-in'>
            <div className='container_singin'>
                <form onSubmit={handleSubmit}>
                    <p className='title'>Sign In</p>
                    <input
                        type='email'
                        name='username'
                        placeholder='Email'
                        value={userDetails?.username || ''}
                        onChange={handleChange}
                        autoComplete='off'
                    />
                    <input
                        type='password'
                        name='password'
                        placeholder='Password'
                        value={userDetails?.password || ''}
                        onChange={handleChange}
                        autoComplete='off'
                    />
                    <button type='submit' className='btn'>Sign In</button>
                    
                    {/* New IDP Login Button */}
                    {idpParams.client_id && (
                        <button 
                            type="button" 
                            className="btn idp-btn"
                            onClick={handleIdpLogin}
                        >
                            Login with IDP Server
                        </button>
                    )}
                </form>
            </div>
        </div>
    );
};

export default SignIn;