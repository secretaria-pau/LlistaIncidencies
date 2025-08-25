export const getIncidents = async () => {
  // Mock implementation of the Google Sheets API
  const mockData = [
    { id: 1, description: 'Printer not working', priority: 'High', state: 'Open' },
    { id: 2, description: 'Cannot access shared folder', priority: 'Medium', state: 'In Progress' },
    { id: 3, description: 'Email client crashing', priority: 'High', state: 'Open' },
    { id: 4, description: 'Software installation request', priority: 'Low', state: 'Closed' },
  ];

  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(mockData);
    }, 1000);
  });
};
