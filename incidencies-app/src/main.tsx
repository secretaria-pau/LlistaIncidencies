import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { GoogleOAuthProvider } from '@react-oauth/google';
import App from './App.tsx';
import { GapiProvider } from './components/GapiLoader.tsx';
import './index.css';

const GOOGLE_CLIENT_ID = "1065194281834-ad8sbed2l4cafr31d0v3u38clqkg9vo6.apps.googleusercontent.com";
const API_KEY = "AIzaSyBjh2dIY7jMoCDz9YQdxsIV5VM-JfQ7fzg";

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <GapiProvider apiKey={API_KEY}>
        <App />
      </GapiProvider>
    </GoogleOAuthProvider>
  </StrictMode>,
);
