import React, { useState, useEffect } from 'react';
import { getTICIncidents, addTICIncident, updateTICIncident, exportTICPendingIncidents } from '../googleServices';

const TICIncidentsView = ({ onBackClick, profile, accessToken, users }) => {
  const [incidents, setIncidents] = useState([]);
  const [filteredIncidents, setFilteredIncidents] = useState([]);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [editingIncident, setEditingIncident] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [popover, setPopover] = useState({ show: false, content: '', x: 0, y: 0 });

  useEffect(() => {
    fetchIncidents();
  }, []);

  const fetchIncidents = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getTICIncidents(accessToken);
      if (response.status === 'success') {
        setIncidents(response.data);
        setFilteredIncidents(response.data);
      } else {
        setError(response.message);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Search logic
  useEffect(() => {
    const lowercasedFilter = searchTerm.toLowerCase();
    const filteredData = incidents.filter(item => {
      return Object.keys(item).some(key =>
        typeof item[key] === 'string' && item[key].toLowerCase().includes(lowercasedFilter)
      );
    });
    setFilteredIncidents(filteredData);
  }, [searchTerm, incidents]);

  const handleSelectIncident = (incident) => {
    setSelectedIncident(incident);
    setEditingIncident(null);
  };

  const handleEditIncident = (incident) => {
    setSelectedIncident(null);
    setEditingIncident(incident);
  };

  const handleAddNewIncident = () => {
    setSelectedIncident(null);
    setEditingIncident({
      "Qui fa la incidencia?": profile.email,
      "Estat": "Comunicat"
    });
  };

  const handleSaveIncident = async (incidentData) => {
    setLoading(true);
    setError(null);
    try {
      let response;
      if (incidentData.ID) {
        response = await updateTICIncident(incidentData, accessToken);
      } else {
        response = await addTICIncident(incidentData, accessToken);
      }

      if (response.status === 'success') {
        fetchIncidents();
        setEditingIncident(null);
        setSelectedIncident(null);
      } else {
        setError(response.message);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await exportTICPendingIncidents(accessToken);
      if (response.status === 'success') {
        alert(`S'ha creat la fulla de càlcul: ${response.data}`);
        window.open(response.data, '_blank');
      } else {
        setError(response.message);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleMouseEnter = (e, content) => {
    e.stopPropagation();
    setPopover({ show: true, content, x: e.clientX, y: e.clientY });
  };

  const handleMouseLeave = (e) => {
    e.stopPropagation();
    setPopover({ show: false, content: '', x: 0, y: 0 });
  };

  const handleRowClick = (incident) => {
    if (profile.role === 'Gestor' || profile.role === 'Direcció') {
      handleEditIncident(incident);
    } else {
      handleSelectIncident(incident);
    }
  };

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Incidències TIC</h2>
        <div className="d-flex align-items-center">
          <div className="text-end me-3">
            <div><strong>{profile.name}</strong> ({profile.role})</div>
            <div><small>{profile.email}</small></div>
          </div>
          <button onClick={onBackClick} className="btn btn-secondary">Tornar</button>
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      {loading && <p>Carregant...</p>}

      {popover.show && (
        <div className="popover" style={{ top: popover.y + 10, left: popover.x + 10, position: 'fixed', zIndex: 1080, padding: '1rem' }}>
          {popover.content}
        </div>
      )}

      <div className="row">
        <div className="col-md-8">
          <h3>Llistat d'incidències</h3>
          {/* Search bar and export button */}
          <div className="d-flex justify-content-between mb-3">
            <input 
              type="text"
              className="form-control w-50"
              placeholder="Cerca..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {(profile.role === 'Gestor' || profile.role === 'Direcció') && (
              <button className="btn btn-success" onClick={handleExport}>Tasques pendents</button>
            )}
          </div>
          {/* Incidents table */}
          <div className="table-responsive">
            <table className="table table-sm small">
              <thead>
                <tr>
                  <th>Tipus</th>
                  <th>Qui fa la incidencia?</th>
                  <th>Espai</th>
                  <th>Dispositiu afectat</th>
                  <th></th>
                  <th>Estat</th>
                  <th>Data de comunicació</th>
                  <th>Data de la darrera edició</th>
                </tr>
              </thead>
              <tbody>
                {['Comunicat', 'En reparació', 'Solucionat', 'Avariat'].map(estat => (
                  <React.Fragment key={estat}>
                    <tr>
                      <td colSpan="10" className="table-primary"><strong>{estat}</strong></td>
                    </tr>
                    {filteredIncidents.filter(inc => inc.Estat === estat).map(incident => (
                      <tr key={incident.ID} onClick={() => handleRowClick(incident)} style={{ cursor: 'pointer' }}>
                        <td>{incident.Tipus}</td>
                        <td>{incident["Qui fa la incidencia?"]}</td>
                        <td>{incident.Espai}</td>
                        <td>{incident["Dispositiu afectat"]}</td>
                        <td>
                          <span 
                            className="info-icon"
                            onMouseEnter={(e) => handleMouseEnter(e, incident.Descripció)}
                            onMouseLeave={handleMouseLeave}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-info-circle" viewBox="0 0 16 16">
                              <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16"/>
                              <path d="m8.93 6.588-2.29.287-.082.38.45.083c.294.07.352.176.288.469l-.738 3.468c-.194.897.105 1.319.808 1.319.545 0 1.178-.252 1.465-.598l.088-.416c-.2.176-.492.246-.686.246-.275 0-.375-.193-.304-.533zM9 4.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0"/>
                            </svg>
                          </span>
                        </td>
                        <td>{incident.Estat}</td>
                        <td>{new Date(incident["Data de comunicació"]).toLocaleDateString('ca-ES')}</td>
                        <td>{new Date(incident["Data de la darrera edició"]).toLocaleDateString('ca-ES')}</td>
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="col-md-4">
          <h3>Detalls</h3>
          <button className="btn btn-primary mb-3" onClick={handleAddNewIncident}>Nova Incidència</button>
          {selectedIncident && (
            <div className="card">
              <div className="card-header d-flex justify-content-between align-items-center">
                <h4>Detalls de la incidència</h4>
                <button type="button" className="btn-close" onClick={() => setSelectedIncident(null)}></button>
              </div>
              <div className="card-body">
                <p><strong>Tipus:</strong> {selectedIncident.Tipus}</p>
                <p><strong>Qui fa la incidencia?:</strong> {selectedIncident["Qui fa la incidencia?"]}</p>
                <p><strong>Espai:</strong> {selectedIncident.Espai}</p>
                <p><strong>Dispositiu afectat:</strong> {selectedIncident["Dispositiu afectat"]}</p>
                <p><strong>Descripció:</strong> {selectedIncident.Descripció}</p>
                <p><strong>Estat:</strong> {selectedIncident.Estat}</p>
                <p><strong>Data de comunicació:</strong> {new Date(selectedIncident["Data de comunicació"]).toLocaleDateString('ca-ES')}</p>
                <p><strong>Data de la darrera edició:</strong> {new Date(selectedIncident["Data de la darrera edició"]).toLocaleDateString('ca-ES')}</p>
              </div>
            </div>
          )}
          {editingIncident && (
            <div className="card">
              <div className="card-header"><h4>{editingIncident.ID ? 'Editar incidència' : 'Nova incidència'}</h4></div>
              <div className="card-body">
                <form onSubmit={(e) => { e.preventDefault(); handleSaveIncident(editingIncident); }}>
                  <div className="mb-3">
                    <label className="form-label">Tipus</label>
                    <select className="form-select" value={editingIncident.Tipus || ''} onChange={(e) => setEditingIncident({...editingIncident, Tipus: e.target.value})}>
                      <option value="">Selecciona un tipus</option>
                      <option value="Dispositiu portàtil">Dispositiu portàtil</option>
                      <option value="Ordinador de sobretaula">Ordinador de sobretaula</option>
                      <option value="Impressió">Impressió</option>
                      <option value="Projector o monitor">Projector o monitor</option>
                      <option value="Equip de so">Equip de so</option>
                      <option value="Maleta audiovisual">Maleta audiovisual</option>
                      <option value="Altres">Altres</option>
                    </select>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Qui fa la incidencia?</label>
                    <select className="form-select" value={editingIncident["Qui fa la incidencia?"] || ''} onChange={(e) => setEditingIncident({...editingIncident, "Qui fa la incidencia?": e.target.value})} disabled={!editingIncident.ID}>
                      <option value="">Selecciona un usuari</option>
                      {users && users.map(user => (
                        <option key={user.email} value={user.email}>{user.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Espai</label>
                    <select className="form-select" value={editingIncident.Espai || ''} onChange={(e) => setEditingIncident({...editingIncident, Espai: e.target.value})}>
                      <option value="">Selecciona un espai</option>
                      <option value="Aula 4.1 informàtica">Aula 4.1 informàtica</option>
                      <option value="Aula 4.2">Aula 4.2</option>
                      <option value="Aula 4.3">Aula 4.3</option>
                      <option value="Aula 4.4">Aula 4.4</option>
                      <option value="Aula 4.5 informàtica 2">Aula 4.5 informàtica 2</option>
                      <option value="Sala de professors">Sala de professors</option>
                      <option value="Direcció, administració i recepció">Direcció, administració i recepció</option>
                      <option value="Aula 5.1">Aula 5.1</option>
                      <option value="Aula 5.2">Aula 5.2</option>
                      <option value="Aula 5.3">Aula 5.3</option>
                      <option value="Aula 5.4">Aula 5.4</option>
                      <option value="Sala polivalent, menjador i altres">Sala polivalent, menjador i altres</option>
                    </select>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Dispositiu afectat</label>
                    <textarea className="form-control" value={editingIncident["Dispositiu afectat"] || ''} onChange={(e) => setEditingIncident({...editingIncident, "Dispositiu afectat": e.target.value})}></textarea>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Descripció</label>
                    <textarea className="form-control" value={editingIncident.Descripció || ''} onChange={(e) => setEditingIncident({...editingIncident, Descripció: e.target.value})}></textarea>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Estat</label>
                    <select className="form-select" value={editingIncident.Estat || ''} onChange={(e) => setEditingIncident({...editingIncident, Estat: e.target.value})} disabled={!editingIncident.ID}>
                      <option value="">Selecciona un estat</option>
                      <option value="Comunicat">Comunicat</option>
                      <option value="En reparació">En reparació</option>
                      <option value="Solucionat">Solucionat</option>
                      <option value="Avariat">Avariat</option>
                    </select>
                  </div>
                  <button type="submit" className="btn btn-primary">Guardar</button>
                  <button type="button" className="btn btn-secondary ms-2" onClick={() => { setEditingIncident(null); setSelectedIncident(null); }}>Cancelar</button>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TICIncidentsView;