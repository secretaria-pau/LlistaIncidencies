// avisosService.js (JSONP version)

const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwDpnq_nRwb7DQi9r6KjHIp3NjPNKeJNtrxDeaL1oZREl3BD9oeRAWGzJ-FMTD9c6fFhg/exec'; // User must update this

// Helper to make JSONP requests
const makeJsonpRequest = (action, params = {}) => {
    return new Promise((resolve, reject) => {
        const callbackName = 'jsonp_callback_' + Math.round(100000 * Math.random());
        
        window[callbackName] = (data) => {
            delete window[callbackName];
            document.body.removeChild(script);
            if (data.success) {
                resolve(data.data);
            }
            else {
                reject(new Error(data.message || 'Unknown error'));
            }
        };

        const url = new URL(SCRIPT_URL);
        url.searchParams.append('action', action);
        url.searchParams.append('callback', callbackName);
        
        // Append other parameters
        for (const key in params) {
            if (params.hasOwnProperty(key)) {
                url.searchParams.append(key, params[key]);
            }
        }

        const script = document.createElement('script');
        script.src = url.toString();
        script.onerror = () => {
            delete window[callbackName];
            document.body.removeChild(script);
            reject(new Error('Network error or script loading failed.'));
        };
        document.body.appendChild(script);
    });
};

export const getActiveAvisos = async (accessToken) => {
    // Access token is not directly used by JSONP, but might be needed for GAS Session.getActiveUser().getEmail()
    // If GAS needs accessToken, it must be passed as a parameter.
    // For now, assuming GAS handles auth via Session.getActiveUser()
    return makeJsonpRequest('getActiveAvisos');
};

export const getAllAvisos = async (accessToken) => {
    return makeJsonpRequest('getAllAvisos');
};

export const addAviso = async (payload, accessToken) => {
    // For JSONP, POST data must be sent as GET parameters
    return makeJsonpRequest('addAviso', { data: JSON.stringify(payload) });
};

export const toggleAvisoStatus = async (id, accessToken) => {
    // For JSONP, POST data must be sent as GET parameters
    return makeJsonpRequest('toggleAvisoStatus', { id: id });
};