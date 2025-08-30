import React from 'react';

const CalendarToolbar = ({ calendars, activeCalendar, setActiveCalendar, currentView, setCurrentView, profile, onAddEventClick }) => {
  
  const canEdit = profile && (profile.role === 'Gestor' || profile.role === 'Direcció');
  const isIncidentsCalendar = activeCalendar === 'incidents';

  return (
    <div className="d-flex justify-content-between align-items-center mb-4">
      <div className="btn-group" role="group" aria-label="Calendar Selector">
        {Object.values(calendars).map(calendar => (
          <button 
            key={calendar.id} 
            type="button" 
            className={`btn ${activeCalendar === calendar.id ? 'btn-primary' : 'btn-outline-primary'}`}
            onClick={() => setActiveCalendar(calendar.id)}
          >
            {calendar.name}
          </button>
        ))}
      </div>

      <div>
        {canEdit && !isIncidentsCalendar && (
          <button 
            className="btn btn-success me-3"
            onClick={onAddEventClick}
          >
            Afegir Esdeveniment
          </button>
        )}
        <div className="btn-group" role="group" aria-label="View Selector">
          <button 
            type="button" 
            className={`btn ${currentView === 'month' ? 'btn-secondary' : 'btn-outline-secondary'}`}
            onClick={() => setCurrentView('month')}
          >
            Mes
          </button>
          <button 
            type="button" 
            className={`btn ${currentView === 'week' ? 'btn-secondary' : 'btn-outline-secondary'}`}
            onClick={() => setCurrentView('week')}
          >
            Setmana
          </button>
          <button 
            type="button" 
            className={`btn ${currentView === 'agenda' ? 'btn-secondary' : 'btn-outline-secondary'}`}
            onClick={() => setCurrentView('agenda')}
          >
            Llista
          </button>
        </div>
      </div>
    </div>
  );
};

export default CalendarToolbar;
