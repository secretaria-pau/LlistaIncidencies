import React from 'react';

const HomeView = ({ onIncidentsClick, onCalendarClick, onGroupsClick, profile, onLogout }) => {
  return (
    <div className="container vh-100 d-flex justify-content-center align-items-center">
      <div className="card text-center p-4 shadow">
        <div className="card-body">
          <div className="d-flex justify-content-end">
            <div className="text-end me-3">
              <div><strong>{profile.name}</strong> ({profile.role})</div>
              <div><small>{profile.email}</small></div>
            </div>
            <button onClick={onLogout} className="btn btn-danger">Tancar Sessió</button>
          </div>
          <h1 className="card-title mt-4">Gestió CFA LA PAU</h1>
          <div className="d-grid gap-2">
            <button onClick={onIncidentsClick} className="btn btn-primary">Llibre d'Incidències</button>
            <button onClick={onCalendarClick} className="btn btn-primary">Calendari</button>
            <button onClick={onGroupsClick} className="btn btn-primary">Els meus grups</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomeView;
