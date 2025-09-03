import React, { useState, useEffect } from 'react';
import { getActiveAvisos } from '../avisosService';

const HomeView = ({ onIncidentsClick, onCalendarClick, onGroupsClick, onTICIncidentsClick, onMantenimentClick, onAvisosClick, profile, onLogout, accessToken }) => {
  const [avisos, setAvisos] = useState([]);
  const [loadingAvisos, setLoadingAvisos] = useState(true);

  useEffect(() => {
    const fetchAvisos = async () => {
      if (!accessToken) return;
      try {
        setLoadingAvisos(true);
        const activeAvisos = await getActiveAvisos(accessToken);
        setAvisos(activeAvisos);
      } catch (error) {
        console.error("Error fetching announcements:", error);
        // Optionally set an error state here to show in the UI
      } finally {
        setLoadingAvisos(false);
      }
    };

    fetchAvisos();
  }, [accessToken]);

  return (
    <div className="container my-5">
      {/* Top Bar with Profile and Logout */}
      <div className="d-flex justify-content-end align-items-center mb-4">
        <div className="text-end me-3">
          <div><strong>{profile.name}</strong> ({profile.role})</div>
          <div><small>{profile.email}</small></div>
        </div>
        <button onClick={onLogout} className="btn btn-danger">Tancar Sessió</button>
      </div>

      <div className="row g-4">
        {/* Left Column: Main Menu */}
        <div className="col-lg-6">
          <div className="card text-center p-4 shadow h-100">
            <div className="card-body d-flex flex-column">
              <h1 className="card-title">App Gestió CFA LA PAU</h1>
              <div className="d-grid gap-3 mt-4 flex-grow-1">
                <button onClick={onIncidentsClick} className="btn btn-primary">Incidències de personal</button>
                <button onClick={onCalendarClick} className="btn btn-primary">Calendaris del centre</button>
                <button onClick={onGroupsClick} className="btn btn-primary">Grups d'alumnes</button>
                <button onClick={onTICIncidentsClick} className="btn btn-info">Incidències TIC</button>
                {(profile.role === 'Gestor' || profile.role === 'Direcció') && (
                  <button onClick={onMantenimentClick} className="btn btn-info">Incidències Manteniment</button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Announcements */}
        <div className="col-lg-6">
          <div className="card text-start shadow h-100 d-flex flex-column">
            <div className="card-header fw-bold">
              Avisos
            </div>
            <div className="card-body flex-grow-1">
              {loadingAvisos ? (
                <p>Carregant avisos...</p>
              ) : (
                <ul className="list-group list-group-flush">
                  <li className="list-group-item">
                    <a href="https://sites.google.com/cfalapau.cat/documents-docents" target="_blank" rel="noopener noreferrer">
                      Documents per als docents (enllaç permanent)
                    </a>
                  </li>
                  {avisos.map(aviso => (
                    <li key={aviso.ID} className="list-group-item">
                      <h6 className="mb-1">{aviso.Titol}</h6>
                      <div dangerouslySetInnerHTML={{ __html: aviso.Contingut }} />
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="card-footer bg-transparent border-top-0 text-end">
                 <button onClick={onAvisosClick} className="btn btn-secondary">Tots els Avisos</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomeView;
