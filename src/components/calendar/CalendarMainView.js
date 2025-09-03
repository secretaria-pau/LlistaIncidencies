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

  const dateIniciIndex = headers.indexOf('Data Inici');
  const timeIniciIndex = headers.indexOf('Hora Inici');
  const dateFiIndex = headers.indexOf('Data Fi');
  const timeFiIndex = headers.indexOf('Hora Fi');
  const typeIndex = headers.indexOf('Tipus');
  const userIndex = headers.indexOf('Usuari (Email)');
  const deletedIndex = headers.indexOf('Esborrat');


  if (dateIniciIndex === -1 || typeIndex === -1 || userIndex === -1) {
    throw new Error("No s'han trobat les columnes necessàries ('Data Inici', 'Tipus', 'Usuari (Email)') a la fulla d'incidències.");
  }

  return data
    .filter(row => row[deletedIndex] !== 'TRUE' && row[dateIniciIndex]) // Filter out deleted and empty incidents
    .map(row => {
      const parseDateTime = (dateStr, timeStr) => {
        let dateParts;
        if (dateStr.includes('/')) { // dd/mm/yyyy
          dateParts = dateStr.split('/').map(p => parseInt(p));
          dateParts = [dateParts[2], dateParts[1] - 1, dateParts[0]]; // y, m-1, d
        } else if (dateStr.includes('-')) { // yyyy-mm-dd
          dateParts = dateStr.split('-').map(p => parseInt(p));
          dateParts = [dateParts[0], dateParts[1] - 1, dateParts[2]]; // y, m-1, d
        } else {
          return null;
        }
        
        const timeParts = timeStr ? String(timeStr).split(':').map(p => parseInt(p)) : [0, 0];
        return new Date(dateParts[0], dateParts[1], dateParts[2], timeParts[0] || 0, timeParts[1] || 0);
      };

      const startDate = parseDateTime(row[dateIniciIndex], row[timeIniciIndex]);
      if (!startDate) return null;

      const isAllDay = !row[timeIniciIndex];
      
      let endDate;
      // Use end date/time if available, otherwise use start date/time
      const endDateStr = row[dateFiIndex] || row[dateIniciIndex];
      const endTimeStr = row[timeFiIndex] || row[timeIniciIndex];
      endDate = parseDateTime(endDateStr, endTimeStr);

      if (!endDate || endDate < startDate) {
          endDate = new Date(startDate);
          if (!isAllDay) {
              endDate.setHours(startDate.getHours() + 1); // Default to 1 hour if end is invalid or missing for timed events
          }
      }
      
      const userEmail = row[userIndex];
      let eventTitle = '';
      let incidentType = '';

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
        end: endDate,
        allDay: isAllDay,
        incidentType: incidentType,
        isIncident: true,
        rawData: row,
        headers: headers,
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
  const [selectedIncident, setSelectedIncident] = useState(null); // For incident details popup
  const [eventToEdit, setEventToEdit] = useState(null); // To pass to the form
  const [isFormOpen, setIsFormOpen] = useState(false); // Controls the event form modal
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleRefreshEvents = () => {
    fetchCalendarData();
  };

  const handleSelectEvent = (event) => {
    if (event.isIncident) {
      setSelectedIncident(event);
    } else {
      setSelectedEvent(event);
    }
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
        <h2>Calendaris del centre</h2>
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

      {selectedIncident && (
        <div className="modal" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1055 }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Detall de la Incidència</h5>
                <button type="button" className="btn-close" onClick={() => setSelectedIncident(null)}></button>
              </div>
              <div className="modal-body">
                <h4>{selectedIncident.title}</h4>
                <hr />
                <p><strong>Inici:</strong> {selectedIncident.start.toLocaleString('es-ES')}</p>
                <p><strong>Fi:</strong> {selectedIncident.end.toLocaleString('es-ES')}</p>
                {(profile.role === 'Gestor' || profile.role === 'Direcció') && (
                  <div className="mt-4">
                    <h5>Detalls complets (visible per a Gestor/Direcció)</h5>
                    {selectedIncident.headers.map((header, index) => {
                      if (header === 'Esborrat') return null; // Don't show the deleted flag
                      let content = selectedIncident.rawData[index];
                      if (content === 'TRUE') content = 'Sí';
                      if (content === 'FALSE' || content === '') content = 'No';
                      return <p key={header}><strong>{header}:</strong> {content}</p>;
                    })}
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setSelectedIncident(null)}>Tancar</button>
              </div>
            </div>
          </div>
        </div>
      )}

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

