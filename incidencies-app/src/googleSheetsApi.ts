const SPREADSHEET_ID = '1VIrJbGlzQaesw0tpM-TW1Zkca9S-SWB1jeT2zotmDKk';

export const getIncidents = async (gapi: any) => {
  const response = await gapi.client.sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: 'Incidents!A2:D', // Assuming the data is in a sheet named 'Incidents' and starts from A2
  });

  const values = response.result.values || [];
  return values.map((row: any, index: number) => ({
    id: index + 1,
    description: row[0],
    priority: row[1],
    state: row[2],
  }));
};
