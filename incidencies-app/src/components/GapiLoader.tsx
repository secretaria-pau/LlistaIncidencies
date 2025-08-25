import { useEffect, useState } from 'react';

const GAPI_SCRIPT_URL = 'https://apis.google.com/js/api.js';

const useGapi = (apiKey: string, discoveryDocs: string[], scope: string) => {
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
          discoveryDocs: discoveryDocs,
          scope: scope,
        });
        setGapi(window.gapi);
        setIsGapiReady(true);
      });
    };

    return () => {
      document.body.removeChild(script);
    };
  }, [apiKey, discoveryDocs, scope]);

  return { gapi, isGapiReady };
};

export default useGapi;
