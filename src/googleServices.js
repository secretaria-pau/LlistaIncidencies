const BASE_URL = 'https://sheets.googleapis.com/v4/spreadsheets';
const SPREADSHEET_ID = '1dpb2AUnUKFOshd3iuaNBpl5hKYyHNLPIoi7I4F7mKWc';
// IMPORTANT: Replace with your deployed Google Apps Script Web App URL
const GAS_WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbzCy0orDCIST9J_weub449IdKwWPRKcdn30178M_DI1iEHh_veopShgQUNAodGv2MpEqQ/exec'; 

async function fetchGoogleAPI(url, accessToken, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: { 'Authorization': `Bearer ${accessToken}`, ...options.headers },
  });
  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`HTTP error! status: ${response.status}, body: ${errorBody}`);
  }
  return response.json();
}

export async function getConfig(accessToken) {
  try {
    console.log('Fetching config...');
    const url = `${BASE_URL}/${SPREADSHEET_ID}/values/Configuració!A2:F`;
    const data = await fetchGoogleAPI(url, accessToken);
    console.log('Config fetched:', data);
    return Array.isArray(data.values) ? data.values : [];
  } catch (error) {
    console.error('Error fetching config:', error);
    throw error;
  }
}

export async function callGASFunction(action, accessToken, params = {}) {
  return new Promise((resolve, reject) => {
    const callbackName = 'jsonpCallback' + Date.now();
    const script = document.createElement('script');

    window[callbackName] = (data) => {
      delete window[callbackName];
      document.head.removeChild(script);
      resolve(data);
    };

    script.onerror = (error) => {
      delete window[callbackName];
      document.head.removeChild(script);
      reject(new Error(`JSONP request failed: ${error.message}`));
    };

    // Construct query string from params
    const queryString = new URLSearchParams(params).toString();
    script.src = `${GAS_WEB_APP_URL}?action=${action}&callback=${callbackName}&${queryString}`;
    document.head.appendChild(script);
  });
}




export async function getSheetData(sheetName, accessToken) {
  try {
    console.log(`Fetching data for sheet: ${sheetName}...`);
    const url = `${BASE_URL}/${SPREADSHEET_ID}/values/${sheetName}!A2:C`;
    const data = await fetchGoogleAPI(url, accessToken);
    console.log(`${sheetName} data fetched:`, data);
    return Array.isArray(data.values) ? data.values : [];
  } catch (error) {
    console.error(`Error fetching ${sheetName} data:`, error);
    throw error;
  }
}

export async function updateSheetData(range, values, accessToken) {
  try {
    console.log(`Updating sheet data for range: ${range} with values:`, values);
    const url = `${BASE_URL}/${SPREADSHEET_ID}/values/${range}?valueInputOption=USER_ENTERED`;
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ values }),
    });
    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`HTTP error! status: ${response.status}, body: ${errorBody}`);
    }
    console.log(`Sheet data updated for range: ${range}`);
    return response.json();
  } catch (error) {
    console.error(`Error updating sheet data for range ${range}:`, error);
    throw error;
  }
}

export async function updateConfig(config, accessToken) {
  try {
    console.log('Starting updateConfig...');
    const url = `${BASE_URL}/${SPREADSHEET_ID}/values/Configuració!A2:F?valueInputOption=USER_ENTERED`;
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ values: config }),
    });
    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`HTTP error! status: ${response.status}, body: ${errorBody}`);
    }
    console.log('Config updated successfully.');
    return response.json();
  } catch (error) {
    console.error('Error in updateConfig:', error);
    throw error;
  }
}