import React, { useState, useEffect } from 'react';
import { getAllAvisos, toggleAvisoStatus } from '../avisosService';
import AvisoForm from './AvisoForm';

const AvisosView = ({ onBackClick, profile, accessToken }) => {
  const [avisos, setAvisos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false); // To control the form modal

  const canManage = profile.role === 'Direcció';

  const fetchAllAvisos = async () => {
    try {
      setLoading(true);
      const allAvisos = await getAllAvisos(accessToken);
      setAvisos(allAvisos);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllAvisos();
  }, [accessToken]);

  const handleToggleStatus = async (id) => {
    try {
      await toggleAvisoStatus(id, accessToken);
      // Refresh the list to show the new status
      fetchAllAvisos(); 
    } catch (err) {
      alert(`Error al canviar l'estat: ${err.message}`);
    }
  };

  const handleAvisoAdded = () => {
    setIsFormOpen(false);
    fetchAllAvisos(); // Refresh list after adding a new aviso
  }

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Historial d'Avisos</h2>
        <div className="d-flex align-items-center">
          <div className="text-end me-3">
            <div><strong>{profile.name}</strong> ({profile.role})</div>
            <div><small>{profile.email}</small></div>
          </div>
          <button onClick={onBackClick} className="btn btn-secondary">Tornar</button>
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {canManage && (
        <div className="mb-3">
          <button className="btn btn-primary" onClick={() => setIsFormOpen(true)}>+ Afegir Nou Avís</button>
        </div>
      )}

      {isFormOpen && (
        <AvisoForm 
          accessToken={accessToken} 
          onClose={() => setIsFormOpen(false)}
          onAvisoAdded={handleAvisoAdded}
        />
      )}

      {loading ? (
        <p>Carregant avisos...</p>
      ) : (
        <div className="list-group">
          {avisos.map(aviso => (
            <div key={aviso.ID} className="list-group-item list-group-item-action flex-column align-items-start">
              <div className="d-flex w-100 justify-content-between">
                <h5 className="mb-1">{aviso.Titol}</h5>
                <small>{new Date(aviso.Timestamp).toLocaleString('es-ES')}</small>
              </div>
              <div className="mb-1" dangerouslySetInnerHTML={{ __html: aviso.Contingut }} />
              <div className="d-flex w-100 justify-content-between align-items-center mt-2">
                  <small>Estat: {aviso.Actiu ? <span className="badge bg-success">Actiu</span> : <span className="badge bg-danger">Inactiu</span>}</small>
                  {canManage && (
                      <button 
                        className={`btn btn-sm ${aviso.Actiu ? 'btn-warning' : 'btn-success'}`}
                        onClick={() => handleToggleStatus(aviso.ID)}
                      >
                        {aviso.Actiu ? 'Desactivar' : 'Activar'}
                      </button>
                  )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AvisosView;