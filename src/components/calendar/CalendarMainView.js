import React, { useState, useEffect } from 'react';
import CalendarToolbar from './CalendarToolbar';
import CalendarDisplay from './CalendarDisplay';
import EventForm from './EventForm';
import EventDetailModal from './EventDetailModal';
import { getEvents, deleteEvent, updateEvent } from '../../googleCalendarService';
import { fetchSheetData } from '../../googleSheetsService'; // To get incidents
import 'react-big-calendar/lib/css/react-big-calendar.css';

const CALENDARS = {
  laPau: {
    id: 'c_classroom39c07066@group.calendar.google.com',
    name: 'Agenda del CFA La Pau'
  },
  docents: {
    id: 'c_5f59155c69967ab59b0214a1c9c0c44ae76cee4293190f7e948516ead7da7715@group.calendar.google.com',
    name: 'Calendari docents'
  },
  incidents: {
    id: 'incidents',
    name: 'Incidències'
  }
};

// Function to transform sheet data into calendar events
const transformIncidentsToEvents = (sheetData, profile) => {
  if (!sheetData || sheetData.length < 2) return [];
  const headers = sheetData[0];
  const data = sheetData.slice(1);

  const dateIndex = headers.indexOf('Data Inici');
  const timeIndex = headers.indexOf('Hora Inici');
  const typeIndex = headers.indexOf('Tipus');
  const userIndex = headers.indexOf('Usuari (Email)');
  const deletedIndex = headers.indexOf('Esborrat');

  if (dateIndex === -1 || typeIndex === -1 || userIndex === -1) {
    throw new Error("No s'han trobat les columnes necessàries ('Data Inici', 'Tipus', 'Usuari (Email)') a la fulla d'incidències.");
  }

  return data
    .filter(row => row[deletedIndex] !== 'TRUE') // Filter out deleted incidents
    .map(row => {
      const dateStr = row[dateIndex];
      if (!dateStr || dateStr.trim() === '') return null;

      let dateParts;
      if (dateStr.includes('/')) { // Format: dd/mm/yyyy
        dateParts = dateStr.split('/');
        if (dateParts.length !== 3) return null;
      } else if (dateStr.includes('-')) { // Format: yyyy-mm-dd
        dateParts = dateStr.split('-');
        if (dateParts.length !== 3) return null;
        // Reorder for Date constructor: [dd, mm, yyyy]
        dateParts = [dateParts[2], dateParts[1], dateParts[0]]; 
      } else {
        return null; // Unknown format
      }

      const timeParts = row[timeIndex] ? String(row[timeIndex]).split(':') : [0, 0];
      const startDate = new Date(dateParts[2], dateParts[1] - 1, dateParts[0], timeParts[0], timeParts[1]);
      
      const userEmail = row[userIndex];
      let eventTitle = '';
      let incidentType = ''; // Use incidentType instead of eventStyle

      if (profile.role === 'Gestor' || profile.role === 'Direcció') {
        eventTitle = `${row[typeIndex]} (${userEmail})`;
      } else { // Role is 'Usuari'
        eventTitle = `Incidència de ${userEmail}`;
        if (profile.email === userEmail) {
          incidentType = 'own';
        } else {
          incidentType = 'other';
        }
      }
      
      return {
        title: eventTitle,
        start: startDate,
        end: startDate, // Incidents are single points in time
        allDay: false,
        incidentType: incidentType, // Pass incidentType
      };
  }).filter(Boolean); // Filter out null entries
};

const CATEGORY_COLORS = {
  'Coordinador': '#FF8C00',
  'Entrevista': '#9932CC',
  'Activitats': '#20B2AA',
  'Reunions': '#4682B4',
  'JAV': '#32CD32',
  'Calendari': '#FFD700',
  'CSI': '#DC143C',
  'EIB': '#00BFFF',
  'FB': '#6A5ACD',
  'Proves': '#F08080',
};

const LIGHT_CATEGORY_COLORS = {
  'Coordinador': '#FFDAB9',
  'Entrevista': '#E6E6FA',
  'Activitats': '#E0FFFF',
  'Reunions': '#ADD8E6',
  'JAV': '#90EE90',
  'Calendari': '#FFFACD',
  'CSI': '#FFB6C1',
  'EIB': '#B0E0E6',
  'FB': '#DDA0DD',
  'Proves': '#FFC0CB',
};

const INCIDENT_COLORS = {
  'own': '#28a745',
  'other': '#0d6efd',
};

const LIGHT_INCIDENT_COLORS = {
  'own': '#D4EDDA',
  'other': '#CCE5FF',
};

function CalendarMainView({ onBackClick, accessToken, profile }) {
  const [activeCalendar, setActiveCalendar] = useState(CALENDARS.laPau.id);
  const [currentView, setCurrentView] = useState('month');
  const [calendarDate, setCalendarDate] = useState(new Date()); // For navigation
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null); // For event details/editing
  const [eventToEdit, setEventToEdit] = useState(null); // To pass to the form
  const [isFormOpen, setIsFormOpen] = useState(false); // Controls the event form modal
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleRefreshEvents = () => {
    fetchCalendarData();
  };

  const handleSelectEvent = (event) => {
    if (activeCalendar === CALENDARS.incidents.id) return;
    setSelectedEvent(event);
  };

  const handleDeleteEvent = async (eventId) => {
    try {
      await deleteEvent(activeCalendar, eventId, accessToken);
      setSelectedEvent(null);
      handleRefreshEvents();
    } catch (err) {
      setError(err.message || 'Error en esborrar l\'esdeveniment.');
    }
  };

  const handleOpenCreateForm = () => {
    setEventToEdit(null);
    setIsFormOpen(true);
  };

  const handleOpenEditForm = () => {
    setEventToEdit(selectedEvent);
    setSelectedEvent(null);
    setIsFormOpen(true);
  };

  const fetchCalendarData = async () => {
    if (!accessToken || !profile) return;
    setLoading(true);
    setError(null);
    try {
      let fetchedEvents = [];
      if (activeCalendar === CALENDARS.incidents.id) {
        const incidentData = await fetchSheetData('Incidències!A:N', accessToken);
        fetchedEvents = transformIncidentsToEvents(incidentData, profile);
      } else {
        fetchedEvents = await getEvents(activeCalendar, accessToken);
      }
      setEvents(fetchedEvents);
    } catch (err) {
      console.error("Error fetching calendar data:", err);
      setError(err.message || 'Error en carregar les dades del calendari.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCalendarData();
  }, [activeCalendar, accessToken, profile]);

  const eventPropGetter = (view) => (event, start, end, isSelected) => {
    let backgroundColor = '';

    if (event.incidentType) {
      // Incident events
      backgroundColor = view === 'agenda' ? LIGHT_INCIDENT_COLORS[event.incidentType] : INCIDENT_COLORS[event.incidentType];
    } else {
      // GCal events
      const title = event.title || '';
      const category = title.split(':')[0].trim();
      backgroundColor = view === 'agenda' ? LIGHT_CATEGORY_COLORS[category] : CATEGORY_COLORS[category];
      if (!backgroundColor) {
        backgroundColor = view === 'agenda' ? '#E0E0E0' : '#808080'; // Default gray
      }
    }

    return { style: { backgroundColor } };
  };

  const activeCalendarName = Object.values(CALENDARS).find(c => c.id === activeCalendar)?.name || '';

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Calendaris</h2>
        <div className="d-flex align-items-center">
          {profile && (
            <div className="text-end me-3">
              <div><strong>{profile.name}</strong> ({profile.role})</div>
              <div><small>{profile.email}</small></div>
            </div>
          )}
          <button onClick={onBackClick} className="btn btn-secondary">Tornar</button>
        </div>
      </div>

      <CalendarToolbar 
        calendars={CALENDARS}
        activeCalendar={activeCalendar}
        setActiveCalendar={setActiveCalendar}
        currentView={currentView}
        setCurrentView={setCurrentView}
        profile={profile}
        onAddEventClick={handleOpenCreateForm}
      />

      {error && (
        <div className="alert alert-danger mt-3" role="alert">
          {error}
        </div>
      )}

      <EventForm 
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        accessToken={accessToken}
        calendarId={activeCalendar}
        calendarName={activeCalendarName}
        onEventCreated={handleRefreshEvents}
        eventToEdit={eventToEdit}
      />

      <EventDetailModal 
        event={selectedEvent}
        onClose={() => setSelectedEvent(null)}
        calendarName={activeCalendarName}
        profile={profile}
        onDelete={handleDeleteEvent}
        onEdit={handleOpenEditForm}
      />

      {loading ? (
        <p className="text-center mt-3">Cargando esdeveniments...</p>
      ) : (
        <CalendarDisplay 
          events={events} 
          view={currentView} 
          date={calendarDate}
          onView={setCurrentView}
          onNavigate={setCalendarDate}
          onSelectEvent={handleSelectEvent}
          eventPropGetter={eventPropGetter(currentView)}
        />
      )}
    </div>
  );
}

export default CalendarMainView;
