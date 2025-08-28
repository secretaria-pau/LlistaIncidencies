import React, { useState, useEffect } from 'react';

// Helper functions for date conversion
const toInputFormat = (dateStr) => { // dd/mm/yyyy -> yyyy-mm-dd
  if (!dateStr || !dateStr.includes('/')) return dateStr; // Already in correct format or empty
  const parts = dateStr.split('/');
  if (parts.length !== 3) return dateStr; // Invalid format
  return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
};

const toSheetFormat = (dateStr) => { // yyyy-mm-dd -> dd/mm/yyyy
  if (!dateStr || dateStr.includes('/')) return dateStr; // Already in correct format or empty
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr; // Invalid format
  return `${parts[2].padStart(2, '0')}/${parts[1].padStart(2, '0')}/${parts[0]}`;
};

const AddIncidentForm = ({ 
  incidentToEdit, 
  originalSheetRowIndex, 
  onSaveIncident, 
  onClose, 
  setError, 
  profile, 
  users, 
  incidentTypes 
}) => {
  const [incidentData, setIncidentData] = useState({
    'Usuari (Email)': '',
    'Data Inici': '',
    'Hora Inici': '',
    'Data Fi': '',
    'Hora Fi': '',
    'Duració': '',
    'Exercici': '',
    'Tipus': '',
    'Signatura Usuari': false,
    'Timestamp Signatura Usuari': '',
    'Signatura Direcció': false,
    'Timestamp Signatura Direcció': '',
    'Esborrat': false,
    'Observacions': '',
  });
  const [selectedTypeUnit, setSelectedTypeUnit] = useState('H'); // Default to Hours

  useEffect(() => {
    if (incidentToEdit) {
      const mappedData = {
        'Usuari (Email)': incidentToEdit[0] || '',
        'Data Inici': toInputFormat(incidentToEdit[1] || ''),
        'Hora Inici': incidentToEdit[2] || '',
        'Data Fi': toInputFormat(incidentToEdit[3] || ''),
        'Hora Fi': incidentToEdit[4] || '',
        'Duració': incidentToEdit[5] || '',
        'Exercici': incidentToEdit[6] || '',
        'Tipus': incidentToEdit[7] || '',
        'Signatura Usuari': incidentToEdit[8] === 'TRUE',
        'Timestamp Signatura Usuari': incidentToEdit[9] || '',
        'Signatura Direcció': incidentToEdit[10] === 'TRUE',
        'Timestamp Signatura Direcció': incidentToEdit[11] || '',
        'Esborrat': incidentToEdit[12] === 'TRUE',
        'Observacions': incidentToEdit[13] || '',
      };
      setIncidentData(mappedData);
      const typeObj = incidentTypes.find(t => t.type === mappedData.Tipus);
      if (typeObj) {
        setSelectedTypeUnit(typeObj.durationUnit);
      } else {
        setSelectedTypeUnit('H');
      }
    } else {
      const defaultUser = (profile.role === 'Usuari') ? profile.email : '';
      setIncidentData({
        'Usuari (Email)': defaultUser,
        'Data Inici': '',
        'Hora Inici': '',
        'Data Fi': '',
        'Hora Fi': '',
        'Duració': '',
        'Exercici': '',
        'Tipus': '',
        'Signatura Usuari': false,
        'Timestamp Signatura Usuari': '',
        'Signatura Direcció': false,
        'Timestamp Signatura Direcció': '',
        'Esborrat': false,
      });
    }
  }, [incidentToEdit, profile, incidentTypes]);

  const calculateDuration = (data) => {
    const typeObj = incidentTypes.find(t => t.type === data.Tipus);
    const unit = typeObj ? typeObj.durationUnit : 'H';

    const startDate = data['Data Inici'];
    const endDate = data['Data Fi'];

    if (unit === 'D') {
      if (startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        if (end >= start) {
          const diffTime = end.getTime() - start.getTime();
          const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24)) + 1;
          return `${diffDays} dies`;
        }
        return 'Error: Data Fi anterior a Inici';
      }
    } else { // unit === 'H'
      const finalEndDate = endDate || startDate;
      const startTime = data['Hora Inici'];
      const endTime = data['Hora Fi'];

      if (startDate && startTime && finalEndDate && endTime) {
        const startDateTime = new Date(`${startDate}T${startTime}`);
        const endDateTime = new Date(`${finalEndDate}T${endTime}`);

        if (endDateTime >= startDateTime) {
          const durationMs = endDateTime - startDateTime;
          const hours = Math.floor(durationMs / (1000 * 60 * 60));
          const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
          return `${hours}h ${minutes}m`;
        }
        return 'Error: Data/Hora Fi anterior a Inici';
      }
    }
    return '';
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setIncidentData(prevData => {
      const newData = {
        ...prevData,
        [name]: type === 'checkbox' ? checked : value
      };

      if (name === 'Tipus') {
        const typeObj = incidentTypes.find(t => t.type === value);
        const newUnit = typeObj ? typeObj.durationUnit : 'H';
        setSelectedTypeUnit(newUnit);
        // Clear fields that are not relevant for the new type
        if (newUnit === 'H') {
          newData['Data Fi'] = '';
        } else if (newUnit === 'D') {
          newData['Hora Inici'] = '';
          newData['Hora Fi'] = '';
        }
      }

      if (name === 'Data Inici' && value) {
        newData['Exercici'] = new Date(value).getFullYear().toString();
      }

      newData['Duració'] = calculateDuration(newData);

      if (['Data Inici', 'Hora Inici', 'Data Fi', 'Hora Fi', 'Tipus'].includes(name)) {
        if (incidentToEdit && (incidentToEdit[8] === 'TRUE' || incidentToEdit[10] === 'TRUE')) {
          newData['Signatura Usuari'] = false;
          newData['Timestamp Signatura Usuari'] = '';
          newData['Signatura Direcció'] = false;
          newData['Timestamp Signatura Direcció'] = '';
        }
      }

      return newData;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!incidentData['Usuari (Email)'].trim() || !incidentData['Data Inici'].trim() || !incidentData.Tipus.trim()) {
      setError("L'email de l'usuari, la data d'inici i el tipus són obligatoris.");
      return;
    }

    // Create a copy to format for the sheet
    const formattedData = { ...incidentData };
    formattedData['Data Inici'] = toSheetFormat(formattedData['Data Inici']);
    formattedData['Data Fi'] = toSheetFormat(formattedData['Data Fi']);

    const dataToSend = [
      formattedData['Usuari (Email)'],
      formattedData['Data Inici'],
      formattedData['Hora Inici'],
      formattedData['Data Fi'],
      formattedData['Hora Fi'],
      formattedData['Duració'],
      formattedData['Exercici'],
      formattedData['Tipus'],
      formattedData['Signatura Usuari'] ? 'TRUE' : 'FALSE',
      formattedData['Timestamp Signatura Usuari'],
      formattedData['Signatura Direcció'] ? 'TRUE' : 'FALSE',
      formattedData['Timestamp Signatura Direcció'],
      formattedData['Esborrat'] ? 'TRUE' : 'FALSE',
      formattedData['Observacions'],
    ];

    try {
      await onSaveIncident(dataToSend, originalSheetRowIndex);
      onClose();
    } catch (err) {
      console.error("Error saving incident:", err);
      setError("Error en guardar la incidència. (Detalls: " + err.message + ")");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mb-4">
      {/* ... form elements ... */}
      <div className="row mb-3">
        <div className="col-md-6">
          <label htmlFor="userEmail" className="form-label">Usuari (Email)</label>
          <select
            className="form-control"
            id="userEmail"
            name="Usuari (Email)"
            value={incidentData['Usuari (Email)']}
            onChange={handleChange}
            required
            disabled={profile?.role === 'Usuari'}
          >
            <option value="">Seleccioneu un usuari</option>
            {users.map((user, index) => (
              <option key={index} value={user.email}>{user.name} ({user.email})</option>
            ))}
          </select>
        </div>
        <div className="col-md-6">
          <label htmlFor="type" className="form-label">Tipus</label>
          <select
            className="form-control"
            id="type"
            name="Tipus"
            value={incidentData['Tipus']}
            onChange={handleChange}
            required
          >
            <option value="">Seleccioneu un tipus</option>
            {incidentTypes.map((typeObj, index) => (
              <option key={index} value={typeObj.type}>{typeObj.type}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="row mb-3">
        <div className="col-md-3">
          <label htmlFor="startDate" className="form-label">Data Inici</label>
          <input
            type="date"
            className="form-control"
            id="startDate"
            name="Data Inici"
            value={incidentData['Data Inici']}
            onChange={handleChange}
            required
          />
        </div>
        
        {selectedTypeUnit === 'D' && (
          <div className="col-md-3">
            <label htmlFor="endDate" className="form-label">Data Fi</label>
            <input
              type="date"
              className="form-control"
              id="endDate"
              name="Data Fi"
              value={incidentData['Data Fi']}
              onChange={handleChange}
            />
          </div>
        )}

        {selectedTypeUnit === 'H' && (
          <>
            <div className="col-md-3">
              <label htmlFor="startTime" className="form-label">Hora Inici</label>
              <input
                type="time"
                className="form-control"
                id="startTime"
                name="Hora Inici"
                value={incidentData['Hora Inici']}
                onChange={handleChange}
              />
            </div>
            <div className="col-md-3">
              <label htmlFor="endTime" className="form-label">Hora Fi</label>
              <input
                type="time"
                className="form-control"
                id="endTime"
                name="Hora Fi"
                value={incidentData['Hora Fi']}
                onChange={handleChange}
              />
            </div>
          </>
        )}
      </div>

      <div className="row mb-3">
        <div className="col-md-6">
          <label htmlFor="duration" className="form-label">Duració</label>
          <input
            type="text"
            className="form-control"
            id="duration"
            name="Duració"
            value={incidentData['Duració']}
            readOnly
          />
        </div>
        <div className="col-md-6">
          <label htmlFor="exercise" className="form-label">Exercici</label>
          <input
            type="text"
            className="form-control"
            id="exercise"
            name="Exercici"
            value={incidentData['Exercici']}
            readOnly
          />
        </div>
      </div>

      <div className="row mb-3">
        <div className="col-md-12">
          <label htmlFor="observacions" className="form-label">Observacions</label>
          <textarea
            className="form-control"
            id="observacions"
            name="Observacions"
            rows="3"
            value={incidentData['Observacions']}
            onChange={handleChange}
          ></textarea>
        </div>
      </div>

      <div className="row mb-3">
        <div className="col-md-3 form-check d-flex align-items-end">
          <input
            type="checkbox"
            className="form-check-input"
            id="userSignature"
            name="Signatura Usuari"
            checked={incidentData['Signatura Usuari']}
            disabled
          />
          <label htmlFor="userSignature" className="form-check-label ms-2">Signatura Usuari</label>
        </div>
        <div className="col-md-3 form-check d-flex align-items-end">
          <input
            type="checkbox"
            className="form-check-input"
            id="directorSignature"
            name="Signatura Direcció"
            checked={incidentData['Signatura Direcció']}
            disabled
          />
          <label htmlFor="directorSignature" className="form-check-label ms-2">Signatura Direcció</label>
        </div>
        <div className="col-md-3 form-check d-flex align-items-end">
          <input
            type="checkbox"
            className="form-check-input"
            id="deleted"
            name="Esborrat"
            checked={incidentData['Esborrat']}
            disabled
          />
          <label htmlFor="deleted" className="form-check-label ms-2">Esborrat</label>
        </div>
      </div>

      <button type="submit" className="btn btn-primary">
        {incidentToEdit ? 'Guardar Canvis' : 'Afegir Incidència'}
      </button>
      <button type="button" className="btn btn-secondary ms-2" onClick={onClose}>
        Cancel·lar
      </button>
    </form>
  );
};

export default AddIncidentForm;
