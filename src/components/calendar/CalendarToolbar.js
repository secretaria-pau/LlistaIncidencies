import React from 'react';
import { Button } from "../ui";

const CalendarToolbar = ({ calendars, activeCalendar, setActiveCalendar, currentView, setCurrentView, profile, onAddEventClick }) => {
  
  const canEdit = profile && (profile.role === 'Gestor' || profile.role === 'Direcció');
  const isIncidentsCalendar = activeCalendar === 'incidents';

  return (
    <div className="flex justify-between items-center mb-4">
      <div className="flex space-x-2" role="group" aria-label="Calendar Selector">
        {Object.values(calendars).map(calendar => (
          <Button 
            key={calendar.id} 
            type="button" 
            variant={activeCalendar === calendar.id ? 'default' : 'outline'}
            className={activeCalendar === calendar.id ? 'bg-[#288185] hover:bg-[#1e686b] text-white' : ''}
            onClick={() => setActiveCalendar(calendar.id)}
          >
            {calendar.name}
          </Button>
        ))}
      </div>

      <div className="flex items-center">
        {canEdit && !isIncidentsCalendar && (
          <Button 
            className="bg-green-600 hover:bg-green-700 text-white mr-3"
            onClick={onAddEventClick}
          >
            Afegir Esdeveniment
          </Button>
        )}
        <div className="flex space-x-2" role="group" aria-label="View Selector">
          <Button 
            type="button" 
            variant={currentView === 'month' ? 'default' : 'outline'}
            onClick={() => setCurrentView('month')}
          >
            Mes
          </Button>
          <Button 
            type="button" 
            variant={currentView === 'week' ? 'default' : 'outline'}
            onClick={() => setCurrentView('week')}
          >
            Setmana
          </Button>
          <Button 
            type="button" 
            variant={currentView === 'agenda' ? 'default' : 'outline'}
            onClick={() => setCurrentView('agenda')}
          >
            Llista
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CalendarToolbar;