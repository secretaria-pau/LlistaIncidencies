import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

const GAPI_SCRIPT_URL = 'https://apis.google.com/js/api.js';

interface GapiContextType {
  gapi: any;
  isGapiReady: boolean;
}

const GapiContext = createContext<GapiContextType | undefined>(undefined);

export const useGapi = () => {
  const context = useContext(GapiContext);
  if (context === undefined) {
    throw new Error('useGapi must be used within a GapiProvider');
  }
  return context;
};

interface GapiProviderProps {
  apiKey: string;
  children: ReactNode;
}

export const GapiProvider = ({ apiKey, children }: GapiProviderProps) => {
  const [gapi, setGapi] = useState<any>(null);
  const [isGapiReady, setIsGapiReady] = useState(false);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = GAPI_SCRIPT_URL;
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);

    script.onload = () => {
      window.gapi.load('client:auth2', async () => {
        await window.gapi.client.init({
          apiKey: apiKey,
          discoveryDocs: ['https://sheets.googleapis.com/$discovery/rest?version=v4'],
          scope: 'https://www.googleapis.com/auth/spreadsheets.readonly',
        });
        setGapi(window.gapi);
        setIsGapiReady(true);
      });
    };

    return () => {
      document.body.removeChild(script);
    };
  }, [apiKey]);

  return (
    <GapiContext.Provider value={{ gapi, isGapiReady }}>
      {children}
    </GapiContext.Provider>
  );
};
