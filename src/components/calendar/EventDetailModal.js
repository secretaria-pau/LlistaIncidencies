import React from 'react';

const EventDetailModal = ({ event, onClose, calendarName, profile, onDelete, onEdit }) => {
  if (!event) return null;

  const { title, start, end, allDay, resource } = event;
  const description = resource?.description;
  const attendees = resource?.attendees || [];
  const canEdit = profile && (profile.role === 'Gestor' || profile.role === 'Direcció');

  const handleDelete = () => {
    if (window.confirm(`Esteu segur que voleu esborrar l'esdeveniment "${title}"?`)) {
      onDelete(resource.id);
    }
  };

  const formatDateTime = (date, isAllDayEvent) => {
    if (!date) return '';
    const options = {
      dateStyle: 'full',
    };
    if (!isAllDayEvent) {
      options.timeStyle = 'short';
    }
    return new Date(date).toLocaleString('es-ES', options);
  }

  // For all-day events, Google's API sets the end date to the morning of the next day.
  // For display, we should show the actual last day of the event.
  const displayEnd = allDay ? new Date(end.getTime() - (24 * 60 * 60 * 1000)) : end;

  return (
    <div className="modal" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-lg">
        <div className="modal-content">
          <div className="modal-header">
            <div>
              <h5 className="modal-title">{title}</h5>
              <small className="text-muted">Calendari: {calendarName}</small>
            </div>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <div className="modal-body">
            <p><strong>Inici:</strong> {formatDateTime(start, allDay)}</p>
            <p><strong>Fi:</strong> {formatDateTime(displayEnd, allDay)}</p>
            {description && (
              <>
                <h6>Descripció:</h6>
                <p>{description}</p>
              </>
            )}
            {attendees.length > 0 && (
              <>
                <h6>Convidats:</h6>
                <ul>
                  {attendees.map(att => <li key={att.email}>{att.email}</li>)}
                </ul>
              </>
            )}
          </div>
          <div className="modal-footer justify-content-between">
            <div>
              {canEdit && (
                <>
                  <button type="button" className="btn btn-primary me-2" onClick={onEdit}>Editar</button>
                  <button type="button" className="btn btn-danger" onClick={handleDelete}>Esborrar</button>
                </>
              )}
            </div>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Tancar</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventDetailModal;
