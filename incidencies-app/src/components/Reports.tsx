import React from 'react';

// Mock data for reports
const reports = [
  { id: 1, title: 'Monthly Incident Summary', date: '2025-08-01' },
  { id: 2, title: 'Incidents by Priority', date: '2025-08-01' },
  { id: 3, title: 'Technician Performance Report', date: '2025-08-01' },
];

const Reports = () => {
  return (
    <div>
      <h2>Informes</h2>
      <ul style={{ listStyleType: 'none', padding: 0 }}>
        {reports.map((report) => (
          <li key={report.id} style={{ marginBottom: '1rem', padding: '1rem', border: '1px solid #ddd' }}>
            <h3 style={{ marginTop: 0 }}>{report.title}</h3>
            <p>Date: {report.date}</p>
            <button>View Report</button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Reports;
