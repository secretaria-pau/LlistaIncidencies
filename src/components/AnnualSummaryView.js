import React, { useState, useEffect } from 'react';

const AnnualSummaryView = ({ incidents }) => {
  const [summaryData, setSummaryData] = useState({});
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());

  useEffect(() => {
    if (!incidents || incidents.length <= 1) {
      setSummaryData({});
      return;
    }

    const headers = incidents[0];
    const incidentRows = incidents.slice(1);

    const userEmailIndex = headers.indexOf('Usuari (Email)');
    const durationIndex = headers.indexOf('Duració');
    const exerciseIndex = headers.indexOf('Exercici');
    const typeIndex = headers.indexOf('Tipus');

    if ([userEmailIndex, durationIndex, exerciseIndex, typeIndex].includes(-1)) {
      console.error("AnnualSummaryView: Missing required columns.");
      return;
    }

    const newSummaryData = {};

    incidentRows.forEach(item => {
      const incident = item.data;
      const userEmail = incident[userEmailIndex];
      const durationStr = incident[durationIndex];
      const year = incident[exerciseIndex];
      const type = incident[typeIndex];

      if (year !== selectedYear || !durationStr) return;

      if (!newSummaryData[userEmail]) {
        newSummaryData[userEmail] = {};
      }
      if (!newSummaryData[userEmail][type]) {
        newSummaryData[userEmail][type] = { hours: 0, minutes: 0, days: 0 };
      }

      if (durationStr.includes('dies')) {
        const days = parseInt(durationStr) || 0;
        newSummaryData[userEmail][type].days += days;
      } else if (durationStr.includes('h')) {
        const hourMatch = durationStr.match(/(\d+)h/);
        const minMatch = durationStr.match(/(\d+)m/);
        const h = hourMatch ? parseInt(hourMatch[1]) : 0;
        const m = minMatch ? parseInt(minMatch[1]) : 0;
        newSummaryData[userEmail][type].hours += h;
        newSummaryData[userEmail][type].minutes += m;
      }
    });

    // Normalize minutes to hours for each entry
    for (const user in newSummaryData) {
      for (const type in newSummaryData[user]) {
        const totalMinutes = newSummaryData[user][type].minutes;
        newSummaryData[user][type].hours += Math.floor(totalMinutes / 60);
        newSummaryData[user][type].minutes = totalMinutes % 60;
      }
    }

    setSummaryData(newSummaryData);
  }, [incidents, selectedYear]);

  const years = [...new Set(incidents.slice(1).map(item => item.data[incidents[0].indexOf('Exercici')]))].filter(Boolean).sort((a, b) => b - a);
  const allTypes = [...new Set(incidents.slice(1).map(item => item.data[incidents[0].indexOf('Tipus')]))].filter(Boolean);

  const formatDuration = (summary) => {
    let parts = [];
    if (summary.days > 0) {
      parts.push(`${summary.days}d`);
    }
    if (summary.hours > 0 || summary.minutes > 0) {
      parts.push(`${summary.hours}h ${summary.minutes}m`);
    }
    return parts.length > 0 ? parts.join(', ') : '-';
  };

  return (
    <div className="mt-4">
      <h3>Resum Anual d'Incidències</h3>
      <div className="mb-3">
        <label htmlFor="summaryYearFilter" className="form-label">Seleccioneu l'Any:</label>
        <select
          className="form-control"
          id="summaryYearFilter"
          value={selectedYear}
          onChange={(e) => setSelectedYear(e.target.value)}
        >
          {years.map(year => (
            <option key={year} value={year}>{year}</option>
          ))}
        </select>
      </div>

      {Object.keys(summaryData).length > 0 ? (
        <table className="table table-striped table-bordered">
          <thead className="thead-light">
            <tr>
              <th>Usuari</th>
              {allTypes.map((type, index) => (
                <th key={index}>{type}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Object.keys(summaryData).map(userEmail => (
              <tr key={userEmail}>
                <td>{userEmail}</td>
                {allTypes.map((type, index) => (
                  <td key={index}>
                    {summaryData[userEmail][type] ? formatDuration(summaryData[userEmail][type]) : '-'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p>No hi ha dades de resum per mostrar per a l'any seleccionat.</p>
      )}
    </div>
  );
};

export default AnnualSummaryView;
