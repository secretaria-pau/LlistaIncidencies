import React, { useEffect, useState, useMemo } from 'react';
import { getIncidents } from '../googleSheetsApi';
import { useGapi } from './GapiLoader';

interface Incident {
  id: number;
  description: string;
  priority: string;
  state: string;
}

type SortKey = keyof Incident;

const ITEMS_PER_PAGE = 10;

const IncidentsList = () => {
  const { gapi, isGapiReady } = useGapi();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: 'ascending' | 'descending' } | null>(null);
  const [filter, setFilter] = useState({ description: '', priority: '', state: '' });
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    if (isGapiReady) {
      const fetchIncidents = async () => {
        try {
          const data = await getIncidents(gapi);
          setIncidents(data as Incident[]);
        } catch (err) {
          setError('Error fetching incidents');
        }
        setLoading(false);
      };

      fetchIncidents();
    }
  }, [gapi, isGapiReady]);

  const paginatedAndFilteredAndSortedIncidents = useMemo(() => {
    let filteredIncidents = incidents.filter(
      (incident) =>
        incident.description.toLowerCase().includes(filter.description.toLowerCase()) &&
        incident.priority.toLowerCase().includes(filter.priority.toLowerCase()) &&
        incident.state.toLowerCase().includes(filter.state.toLowerCase())
    );

    if (sortConfig !== null) {
      filteredIncidents.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }

    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredIncidents.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [incidents, sortConfig, filter, currentPage]);

  const requestSort = (key: SortKey) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFilter((prevFilter) => ({ ...prevFilter, [name]: value }));
    setCurrentPage(1);
  };

  const totalPages = Math.ceil(
    incidents.filter(
      (incident) =>
        incident.description.toLowerCase().includes(filter.description.toLowerCase()) &&
        incident.priority.toLowerCase().includes(filter.priority.toLowerCase()) &&
        incident.state.toLowerCase().includes(filter.state.toLowerCase())
    ).length / ITEMS_PER_PAGE
  );

  if (!isGapiReady || loading) {
    return <p>Loading incidents...</p>;
  }

  if (error) {
    return <p>{error}</p>;
  }

  return (
    <div>
      <h2>Llistat d'Incidències</h2>
      <div style={{ marginBottom: '1rem' }}>
        <input
          type="text"
          name="description"
          placeholder="Filter by description"
          value={filter.description}
          onChange={handleFilterChange}
          style={{ marginRight: '1rem' }}
        />
        <input
          type="text"
          name="priority"
          placeholder="Filter by priority"
          value={filter.priority}
          onChange={handleFilterChange}
          style={{ marginRight: '1rem' }}
        />
        <input
          type="text"
          name="state"
          placeholder="Filter by state"
          value={filter.state}
          onChange={handleFilterChange}
        />
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid #ddd' }}>
            <th style={{ padding: '8px', textAlign: 'left' }}>
              <button onClick={() => requestSort('id')}>ID</button>
            </th>
            <th style={{ padding: '8px', textAlign: 'left' }}>
              <button onClick={() => requestSort('description')}>Descripció</button>
            </th>
            <th style={{ padding: '8px', textAlign: 'left' }}>
              <button onClick={() => requestSort('priority')}>Prioritat</button>
            </th>
            <th style={{ padding: '8px', textAlign: 'left' }}>
              <button onClick={() => requestSort('state')}>Estat</button>
            </th>
          </tr>
        </thead>
        <tbody>
          {paginatedAndFilteredAndSortedIncidents.map((incident) => (
            <tr key={incident.id} style={{ borderBottom: '1px solid #ddd' }}>
              <td style={{ padding: '8px' }}>{incident.id}</td>
              <td style={{ padding: '8px' }}>{incident.description}</td>
              <td style={{ padding: '8px' }}>{incident.priority}</td>
              <td style={{ padding: '8px' }}>{incident.state}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ marginTop: '1rem' }}>
        <button onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))} disabled={currentPage === 1}>
          Previous
        </button>
        <span style={{ margin: '0 1rem' }}>
          Page {currentPage} of {totalPages}
        </span>
        <button onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages}>
          Next
        </button>
      </div>
    </div>
  );
};

export default IncidentsList;
