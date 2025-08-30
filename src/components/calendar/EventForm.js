import React, { useState, useEffect } from 'react';
import Select from 'react-select';
import { getUsers } from '../../googleSheetsService';
import { createEvent, updateEvent } from '../../googleCalendarService';

const CATEGORIES = ['Coordinador', 'Entrevista', 'Activitats', 'Reunions', 'JAV', 'Calendari', 'CSI', 'EIB', 'FB', 'Proves'];

const EventForm = ({ isOpen, onClose, accessToken, calendarId, calendarName, onEventCreated, eventToEdit }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [isAllDay, setIsAllDay] = useState(false);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState('09:00');
  const [duration, setDuration] = useState(60); // in minutes
  const [allUsers, setAllUsers] = useState([]);
  const [invitedGuests, setInvitedGuests] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const isEditMode = eventToEdit !== null;

  useEffect(() => {
    // Fetch users when the form is opened
    if (isOpen) {
      const fetchUsers = async () => {
        try {
          const usersData = await getUsers(accessToken);
          setAllUsers(usersData.map(u => ({ value: u.email, label: `${u.name} (${u.email})` })));
        } catch (err) {
          setError('No s\'ha pogut carregar la llista d\'usuaris.');
        }
      };
      fetchUsers();
    }

    // Pre-fill form if in edit mode
    if (isOpen && isEditMode) {
      const [eventCategory, ...eventTitleParts] = eventToEdit.title.split(': ');
      const eventTitle = eventTitleParts.join(': ');

      setTitle(eventTitle);
      setDescription(eventToEdit.resource.description || '');
      setCategory(CATEGORIES.includes(eventCategory) ? eventCategory : CATEGORIES[0]);
      setIsAllDay(eventToEdit.allDay);
      
      const start = new Date(eventToEdit.start);
      const end = new Date(eventToEdit.end);

      setStartDate(start.toISOString().split('T')[0]);
      setTime(start.toTimeString().slice(0, 5));

      if (eventToEdit.allDay) {
        setEndDate(end.toISOString().split('T')[0]);
      } else {
        const diffMinutes = (end.getTime() - start.getTime()) / 60000;
        setDuration(diffMinutes);
      }

      if (eventToEdit.resource.attendees) {
        setInvitedGuests(eventToEdit.resource.attendees.map(att => ({ value: att.email, label: att.email })));
      }

    } else if (isOpen && !isEditMode) {
      // Reset form for new event
      setTitle('');
      setDescription('');
      setCategory(CATEGORIES[0]);
      setIsAllDay(false);
      const today = new Date().toISOString().split('T')[0];
      setStartDate(today);
      setEndDate(today);
      setTime('09:00');
      setDuration(60);
      setInvitedGuests([]);
      setError('');
    }

  }, [isOpen, isEditMode, eventToEdit, accessToken]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    let eventData = {
      summary: `${category}: ${title}`,
      description,
      attendees: invitedGuests.map(guest => ({ email: guest.value })),
    };

    if (isAllDay) {
      const finalEndDate = new Date(endDate);
      finalEndDate.setDate(finalEndDate.getDate() + 1);
      eventData.start = { date: startDate };
      eventData.end = { date: finalEndDate.toISOString().split('T')[0] };
    } else {
      const startDateTime = new Date(`${startDate}T${time}`);
      const endDateTime = new Date(startDateTime.getTime() + duration * 60000);
      eventData.start = { dateTime: startDateTime.toISOString(), timeZone: 'Europe/Madrid' };
      eventData.end = { dateTime: endDateTime.toISOString(), timeZone: 'Europe/Madrid' };
    }

    try {
      if (isEditMode) {
        await updateEvent(calendarId, eventToEdit.resource.id, eventData, accessToken);
      } else {
        await createEvent(calendarId, eventData, accessToken);
      }
      onEventCreated();
      onClose();
    } catch (err) {
      setError(err.message || `Error en ${isEditMode ? 'actualitzar' : 'crear'} l\'esdeveniment.`);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-lg">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">{isEditMode ? 'Editar Esdeveniment' : `Afegir Esdeveniment a: ${calendarName}`}</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <div className="modal-body">
            {error && <div className="alert alert-danger">{error}</div>}
            <form onSubmit={handleSubmit}>
              {/* Form fields remain the same */}
              <div className="mb-3">
                <label htmlFor="category" className="form-label">Categoria</label>
                <select id="category" className="form-select" value={category} onChange={e => setCategory(e.target.value)}>
                  {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>
              <div className="mb-3">
                <label htmlFor="title" className="form-label">Títol</label>
                <input type="text" className="form-control" id="title" value={title} onChange={e => setTitle(e.target.value)} required />
              </div>
              <div className="mb-3">
                <label htmlFor="description" className="form-label">Descripció</label>
                <textarea className="form-control" id="description" rows="3" value={description} onChange={e => setDescription(e.target.value)}></textarea>
              </div>

              <div className="form-check mb-3">
                <input className="form-check-input" type="checkbox" id="allDayCheck" checked={isAllDay} onChange={e => setIsAllDay(e.target.checked)} />
                <label className="form-check-label" htmlFor="allDayCheck">
                  Tot el dia
                </label>
              </div>

              <div className="row">
                <div className="col-md-4 mb-3">
                  <label htmlFor="startDate" className="form-label">Data d'inici</label>
                  <input type="date" className="form-control" id="startDate" value={startDate} onChange={e => setStartDate(e.target.value)} required />
                </div>
                {isAllDay ? (
                  <div className="col-md-4 mb-3">
                    <label htmlFor="endDate" className="form-label">Data de fi</label>
                    <input type="date" className="form-control" id="endDate" value={endDate} onChange={e => setEndDate(e.target.value)} required />
                  </div>
                ) : (
                  <>
                    <div className="col-md-4 mb-3">
                      <label htmlFor="time" className="form-label">Hora d'inici</label>
                      <input type="time" className="form-control" id="time" value={time} onChange={e => setTime(e.target.value)} required />
                    </div>
                    <div className="col-md-4 mb-3">
                      <label htmlFor="duration" className="form-label">Duració (minuts)</label>
                      <input type="number" className="form-control" id="duration" value={duration} onChange={e => setDuration(parseInt(e.target.value, 10))} step="15" required />
                    </div>
                  </>
                )}
              </div>

              <div className="mb-3">
                <label htmlFor="guests" className="form-label">Convidats</label>
                <Select
                  id="guests"
                  isMulti
                  options={allUsers}
                  value={invitedGuests}
                  onChange={setInvitedGuests}
                  placeholder="Selecciona convidats..."
                />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel·lar</button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? (isEditMode ? 'Actualitzant...' : 'Creant...') : (isEditMode ? 'Actualitzar Esdeveniment' : 'Crear Esdeveniment')}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventForm;
