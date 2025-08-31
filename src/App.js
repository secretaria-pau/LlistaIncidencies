import React, { useState, useEffect } from 'react';
import { GoogleOAuthProvider, useGoogleLogin } from '@react-oauth/google';
import { 
  fetchSheetData, 
  appendSheetData, 
  updateSheetData, 
  getUserProfile, 
  getUsers, 
  getIncidentTypes 
} from './googleSheetsService';
import AddIncidentForm from './components/AddIncidentForm';
import SignatureConfirmPopup from './components/SignatureConfirmPopup';
import AnnualSummaryView from './components/AnnualSummaryView';
import DocumentationView from './components/DocumentationView';
import LoginView from './components/LoginView';
import HomeView from './components/HomeView';
import MyGroupsView from './components/MyGroupsView';
import CalendarMainView from './components/calendar/CalendarMainView';
import TICIncidentsView from './components/TICIncidentsView';
import MantenimentView from './components/MantenimentView';


// Helper function to format dates for display
const formatDateForDisplay = (dateStr) => {
  if (!dateStr) return '';
  if (dateStr.includes('/')) return dateStr; // Already dd/mm/yyyy
  if (dateStr.includes('-')) { // Is yyyy-mm-dd
    const parts = dateStr.split('-');
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr; // Fallback
};

function App() {
  const [currentScreen, setCurrentScreen] = useState('login'); // login, home, incidents, groups
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState(null);
  const [masterIncidents, setMasterIncidents] = useState([]); // Holds all incidents from the sheet
  const [incidents, setIncidents] = useState([]); // Holds filtered incidents for display
  const [modifiedIncidents, setModifiedIncidents] = useState([]); // Holds incidents modified after signing
  const [users, setUsers] = useState([]);
  const [incidentTypes, setIncidentTypes] = useState([]);
  const [filterUser, setFilterUser] = useState('');
  const [filterYear, setFilterYear] = useState('');
  const [editingIncident, setEditingIncident] = useState(null);
  const [isSignaturePopupOpen, setIsSignaturePopupOpen] = useState(false);
  const [incidentToSign, setIncidentToSign] = useState(null);
  const [signatureType, setSignatureType] = useState('');
  const [currentView, setCurrentView] = useState('list');
  const [accessToken, setAccessToken] = useState(() => localStorage.getItem('googleAccessToken'));
  const [popover, setPopover] = useState({ show: false, content: '', x: 0, y: 0 });

  // Effect to load profile if accessToken is already present (from localStorage)
  useEffect(() => {
    const loadProfileFromToken = async () => {
      if (accessToken) {
        try {
          const googleProfile = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: { 'Authorization': `Bearer ${accessToken}` },
          }).then(res => res.json());

          const userProfile = await getUserProfile(googleProfile.email, accessToken);

          if (userProfile) {
            setProfile(userProfile);
            setCurrentScreen('home');
          } else {
            setError("Accés no autoritzat. El vostre correu electrònic no es troba a la llista d'usuaris permesos.");
            setProfile(null);
            setAccessToken(null);
            localStorage.removeItem('googleAccessToken');
          }
        } catch (err) {
          console.error(err);
          setError(err.message || "Ha ocorregut un error durant la càrrega del perfil.");
          setProfile(null);
          setAccessToken(null);
          localStorage.removeItem('googleAccessToken');
        }
      }
    };
    loadProfileFromToken();
  }, []); // Run only once on mount

  const handleSignClick = (incidentData, originalSheetRowIndex, type) => {
    if (!isValidSignDate(incidentData)) {
      setError("No es pot signar una incidència abans de la seva data de finalització (o d'inici si no té data de fi).");
      return;
    }

    setIncidentToSign({ data: incidentData, originalSheetRowIndex: originalSheetRowIndex });
    setSignatureType(type);
    setIsSignaturePopupOpen(true);
  };

  const handleConfirmSignature = async () => {
    if (!incidentToSign || !profile) return;

    const { data, originalSheetRowIndex } = incidentToSign;
    const updatedIncidentData = [...data];

    const now = new Date().toLocaleString('es-ES', {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
      hour12: false
    });

    if (signatureType === 'user') {
      updatedIncidentData[8] = 'TRUE';
      updatedIncidentData[9] = now;
    } else if (signatureType === 'director') {
      updatedIncidentData[10] = 'TRUE';
      updatedIncidentData[11] = now;
    }

    try {
      await updateSheetData(`Incidències!A${originalSheetRowIndex}:N${originalSheetRowIndex}`, [updatedIncidentData], accessToken);
      fetchIncidents(); // Refetch all data after a change
      setIsSignaturePopupOpen(false);
      setIncidentToSign(null);
      setSignatureType('');
    } catch (err) {
      console.error("Error signing incident:", err);
      setError("Error al signar la incidència. (Detalls: " + err.message + ")");
      setIsSignaturePopupOpen(false);
    }
  };

  const isValidSignDate = (incidentData) => {
    const headers = masterIncidents.length > 0 ? masterIncidents[0] : [];
    const dataIniciIndex = headers.indexOf('Data Inici');
    const dataFiIndex = headers.indexOf('Data Fi');

    const dataIniciStr = incidentData[dataIniciIndex] ? incidentData[dataIniciIndex].trim() : '';
    const dataFiStr = incidentData[dataFiIndex] ? incidentData[dataFiIndex].trim() : '';

    const targetDateStr = dataFiStr || dataIniciStr;

    if (!targetDateStr) {
      return false; // No date to check against
    }

    let targetDate;
    if (targetDateStr.includes('/')) {
      const parts = targetDateStr.split('/');
      targetDate = new Date(parts[2], parts[1] - 1, parts[0]);
    } else if (targetDateStr.includes('-')) {
      const parts = targetDateStr.split('-');
      targetDate = new Date(parts[0], parts[1] - 1, parts[2]);
    } else {
      return false; // Invalid date format
    }

    const today = new Date();
    targetDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);

    return today >= targetDate; // True if today is on or after targetDate
  };

  const handleCancelSignature = () => {
    setIsSignaturePopupOpen(false);
    setIncidentToSign(null);
    setSignatureType('');
  };

  const handleEditClick = (incidentData, originalSheetRowIndex) => {
    setEditingIncident({ data: incidentData, originalSheetRowIndex: originalSheetRowIndex });
  };

  const handleCloseForm = () => {
    setEditingIncident(null);
  };

  const handleSaveIncident = async (incidentData, originalSheetRowIndex) => {
    try {
      const isEdit = originalSheetRowIndex !== null;

      if (!isEdit) {
        // It's a new incident, just append it
        await appendSheetData('Incidències!A:N', [incidentData], accessToken);
      } else {
        const originalIncident = editingIncident.data;
        const isUserSigned = originalIncident[8] === 'TRUE';
        const isDirectorSigned = originalIncident[10] === 'TRUE';

        if (isUserSigned || isDirectorSigned) {
          // Signed incident: mark old as deleted and create a new one
          
          // 1. Mark original as deleted
          const deletedIncidentData = [...originalIncident];
          deletedIncidentData[12] = 'TRUE'; // Set 'Esborrat' to TRUE
          await updateSheetData(`Incidències!A${originalSheetRowIndex}:N${originalSheetRowIndex}`, [deletedIncidentData], accessToken);

          // 2. Create new incident with the changes
          // The incidentData from the form already has signatures cleared
          await appendSheetData('Incidències!A:N', [incidentData], accessToken);

        } else {
          // Not signed, just update it
          await updateSheetData(`Incidències!A${originalSheetRowIndex}:N${originalSheetRowIndex}`, [incidentData], accessToken);
        }
      }

      fetchIncidents(); // Refetch all data after a change
      setEditingIncident(null);
    } catch (err) {
      console.error("Error saving incident:", err);
      setError("Error en guardar la incidència. Verifiqueu la configuració y els permisos. (Detalls: " + err.message + ")");
    }
  };

  // Initial data fetch
  const fetchIncidents = async () => {
    if (!accessToken) return;
    try {
      const data = await fetchSheetData('Incidències!A:N', accessToken);
      setMasterIncidents(data);
    } catch (err) {
      console.error("Error fetching incidents:", err);
      setError("Error en carregar les incidències. Verifiqueu la configuració y els permisos.");
    }
  };

  useEffect(() => {
    if (currentScreen === 'incidents' || currentScreen === 'tic-incidents' || currentScreen === 'manteniment-incidents') {
      fetchIncidents();
      
      if (accessToken) {
        const loadFormDependencies = async () => {
          try {
            const [usersData, typesData] = await Promise.all([
              getUsers(accessToken),
              getIncidentTypes(accessToken)
            ]);
            setUsers(usersData); 
            setIncidentTypes(typesData);
          } catch (err) {
            console.error("Error loading form dependencies:", err);
            setError("Error en carregar les dades per als formularis (usuaris/tipus).");
          }
        };
        loadFormDependencies();
      }
    }
  }, [accessToken, currentScreen]);

  // Filtering logic
  useEffect(() => {
    if (masterIncidents.length === 0) {
        setIncidents([]);
        setModifiedIncidents([]);
        return;
    }

    const headers = masterIncidents[0];
    const dataIniciIndex = headers.indexOf('Data Inici');
    const userEmailIndex = headers.indexOf('Usuari (Email)');
    const exerciseIndex = headers.indexOf('Exercici');
    const deletedIndex = headers.indexOf('Esborrat');

    // 1. Map and pre-filter rows that are empty
    let allRows = masterIncidents.slice(1).map((row, index) => ({
        data: row,
        originalSheetRowIndex: index + 2
    })).filter(item => item.data[dataIniciIndex] && item.data[dataIniciIndex].trim() !== '');

    // Separate deleted and active incidents
    const activeRows = allRows.filter(item => item.data[deletedIndex] !== 'TRUE');
    const deletedRows = allRows.filter(item => item.data[deletedIndex] === 'TRUE');

    let filteredActiveRows = activeRows;
    let filteredDeletedRows = deletedRows;

    // 2. Apply user filter
    if (filterUser) {
        filteredActiveRows = filteredActiveRows.filter(item =>
            item.data[userEmailIndex] && item.data[userEmailIndex].toLowerCase().includes(filterUser.toLowerCase())
        );
        filteredDeletedRows = filteredDeletedRows.filter(item =>
            item.data[userEmailIndex] && item.data[userEmailIndex].toLowerCase().includes(filterUser.toLowerCase())
        );
    }

    // 3. Apply year filter
    if (filterYear) {
        filteredActiveRows = filteredActiveRows.filter(item => {
            const year = item.data[exerciseIndex];
            return year && year.toString() === filterYear;
        });
        filteredDeletedRows = filteredDeletedRows.filter(item => {
            const year = item.data[exerciseIndex];
            return year && year.toString() === filterYear;
        });
    }

    // 4. Set the final filtered incidents for display
    setIncidents([headers, ...filteredActiveRows]);
    setModifiedIncidents([headers, ...filteredDeletedRows]);

  }, [masterIncidents, filterUser, filterYear]);

  // Set the user filter automatically when the profile is loaded
  useEffect(() => {
    if (profile && profile.role === 'Usuari') {
      setFilterUser(profile.email);
    }
  }, [profile]);

  const handleMouseEnter = (e, content) => {
    setPopover({ show: true, content, x: e.clientX, y: e.clientY });
  };

  const handleMouseLeave = () => {
    setPopover({ show: false, content: '', x: 0, y: 0 });
  };


  const login = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setAccessToken(tokenResponse.access_token);
      localStorage.setItem('googleAccessToken', tokenResponse.access_token);
      try {
        const googleProfile = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { 'Authorization': `Bearer ${tokenResponse.access_token}` },
        }).then(res => res.json());

        const userProfile = await getUserProfile(googleProfile.email, tokenResponse.access_token);

        if (userProfile) {
          setProfile(userProfile);
          setCurrentScreen('home');
        } else {
          setError("Accés no autoritzat. El vostre correu electrònic no es troba a la llista d'usuaris permesos.");
          setProfile(null);
          setAccessToken(null);
          localStorage.removeItem('googleAccessToken');
        }
      } catch (err) {
        console.error(err);
        setError(err.message || "Ha ocorregut un error durant l'inici de sessió.");
        setProfile(null);
        setAccessToken(null);
        localStorage.removeItem('googleAccessToken');
      }
    },
    onError: () => {
      setError("Error d'inici de sessió. Si us plau, torneu a intentar-ho.");
    },
    scope: 'https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/classroom.courses.readonly https://www.googleapis.com/auth/chat.spaces.readonly https://www.googleapis.com/auth/contacts.readonly https://www.googleapis.com/auth/classroom.rosters.readonly https://www.googleapis.com/auth/chat.memberships https://www.googleapis.com/auth/admin.directory.group.readonly https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/calendar.readonly',
  });

  const handleLogout = () => {
    setProfile(null);
    setAccessToken(null);
    setUsers([]);
    setIncidentTypes([]);
    setMasterIncidents([]);
    localStorage.removeItem('googleAccessToken');
    setCurrentScreen('login');
  };
  
  const IncidentsView = ({ onBackClick }) => {
    const exerciseIndex = masterIncidents.length > 0 ? masterIncidents[0].indexOf('Exercici') : -1;
    const availableYears = exerciseIndex === -1 ? [] : [...new Set(masterIncidents.slice(1).map(item => item[exerciseIndex]))].filter(Boolean).sort((a, b) => b - a);

    const columnHeaders = incidents.length > 0 ? incidents[0] : [];
    const hiddenCols = ['Exercici', 'Esborrat'];
    const visibleHeaders = columnHeaders.map((header, index) => ({ header, index })).filter(h => !hiddenCols.includes(h.header));
    const visibleHeadersModified = columnHeaders.map((header, index) => ({ header, index })).filter(h => h.header !== 'Exercici');

    const dataIniciIndex = columnHeaders.indexOf('Data Inici');
    const horaIniciIndex = columnHeaders.indexOf('Hora Inici');
    const dataFiIndex = columnHeaders.indexOf('Data Fi');
    const horaFiIndex = columnHeaders.indexOf('Hora Fi');
    const signaturaUsuariIndex = columnHeaders.indexOf('Signatura Usuari');
    const timestampSignaturaUsuariIndex = columnHeaders.indexOf('Timestamp Signatura Usuari');
    const signaturaDireccioIndex = columnHeaders.indexOf('Signatura Direcció');
    const timestampSignaturaDireccioIndex = columnHeaders.indexOf('Timestamp Signatura Direcció');
    const userEmailIndex = columnHeaders.indexOf('Usuari (Email)');
    const duracioIndex = columnHeaders.indexOf('Duració');
    const exerciciIndex = columnHeaders.indexOf('Exercici');
    const tipusIndex = columnHeaders.indexOf('Tipus');
    const esborratIndex = columnHeaders.indexOf('Esborrat');
    const observacionsIndex = columnHeaders.indexOf('Observacions');

    // Define the order and content of the new visible headers
    const processedHeaders = [
      { header: 'Usuari (Email)', originalIndex: userEmailIndex },
      { header: 'Inici', originalIndex: dataIniciIndex }, // Combined Data Inici and Hora Inici
      { header: 'Fi', originalIndex: dataFiIndex },       // Combined Data Fi and Hora Fi
      { header: 'Duració', originalIndex: duracioIndex },
      { header: 'Tipus', originalIndex: tipusIndex },
      { header: 'Signatura Usuari', originalIndex: signaturaUsuariIndex }, // Combined Signatura Usuari and Timestamp
      { header: 'Signatura Direcció', originalIndex: signaturaDireccioIndex }, // Combined Signatura Direcció and Timestamp
      // 'Exercici' and 'Esborrat' are typically hidden or handled separately
    ].filter(h => h.originalIndex !== -1);

    const processedHeadersModified = [
      { header: 'Usuari (Email)', originalIndex: userEmailIndex },
      { header: 'Inici', originalIndex: dataIniciIndex },
      { header: 'Fi', originalIndex: dataFiIndex },
      { header: 'Duració', originalIndex: duracioIndex },
      { header: 'Tipus', originalIndex: tipusIndex },
      { header: 'Signatura Usuari', originalIndex: signaturaUsuariIndex },
      { header: 'Signatura Direcció', originalIndex: signaturaDireccioIndex },
      { header: 'Esborrat', originalIndex: esborratIndex },
    ].filter(h => h.originalIndex !== -1);


    return (
      <div className="container mt-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2>Incidències de personal</h2>
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
        
        {error && (
          <div className="alert alert-danger alert-dismissible fade show" role="alert">
            {error}
            <button type="button" className="btn-close" data-bs-dismiss="alert" aria-label="Close" onClick={() => setError(null)}></button>
          </div>
        )}

        {popover.show && (
          <div className="popover" style={{ top: popover.y + 10, left: popover.x + 10 }}>
            {popover.content}
          </div>
        )}

        {profile && (
          <ul className="nav nav-tabs mb-4">
            <li className="nav-item">
              <button
                className={`nav-link ${currentView === 'list' ? 'active' : ''}`}
                onClick={() => setCurrentView('list')}
              >
                Incidències de personal
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link ${currentView === 'modified' ? 'active' : ''}`}
                onClick={() => setCurrentView('modified')}
              >
                Incidències modificades
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link ${currentView === 'summary' ? 'active' : ''}`}
                onClick={() => setCurrentView('summary')}
              >
                Resum Anual
              </button>
            </li>
            <li className="nav-item">
              <button className={`nav-link ${currentView === 'documentation' ? 'active' : ''}`}
                onClick={() => setCurrentView('documentation')}
              >
                Documentació
              </button>
            </li>
          </ul>
        )}

        {currentView === 'list' && (
          <>
            <h3 className="mt-4">Filtres</h3>
            <div className="row mb-3">
              { (profile?.role === 'Gestor' || profile?.role === 'Direcció') ? (
                <div className="col-md-6">
                  <label htmlFor="filterUser" className="form-label">Filtrar per Usuari</label>
                  <select
                    className="form-control"
                    id="filterUser"
                    value={filterUser}
                    onChange={(e) => setFilterUser(e.target.value)}
                  >
                    <option value="">Tots els usuaris</option>
                    {users.map(user => (
                      <option key={user.email} value={user.email}>{user.name}</option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="col-md-6">
                  <label htmlFor="filterUser" className="form-label">Les meves Incidències</label>
                  <input
                    type="text"
                    className="form-control"
                    id="filterUser"
                    value={profile.email}
                    readOnly
                  />
                </div>
              )}
              <div className="col-md-6">
                <label htmlFor="filterYear" className="form-label">Filtrar per Any</label>
                <select
                  className="form-control"
                  id="filterYear"
                  value={filterYear}
                  onChange={(e) => setFilterYear(e.target.value)}
                >
                  <option value="">Tots els anys</option>
                  {availableYears.map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="d-flex justify-content-between align-items-center mb-3">
              <h3>Incidències de personal</h3>
              <button
                className="btn btn-success"
                onClick={() => setEditingIncident({ data: null, originalSheetRowIndex: null })}
              >
                Afegir Nova Incidència
              </button>
            </div>

            {incidents.length > 1 ? (
              <table className="table table-striped">
                <thead>
                  <tr>
                    {processedHeaders.map(h => (
                      <th key={h.header}>{h.header}</th>
                    ))}
                    <th>Accions</th>
                  </tr>
                </thead>
                <tbody>
                  {incidents.slice(1).map((item, rowIndex) => {
                    const isUserSigned = item.data[signaturaUsuariIndex] === 'TRUE';
                    const isDirectorSigned = item.data[signaturaDireccioIndex] === 'TRUE';
                    const canSign = isValidSignDate(item.data);
                    const canUserSign = profile?.role === 'Usuari' && !isUserSigned && !isDirectorSigned && canSign;
                    const canDirectorSign = profile?.role === 'Direcció' && !isDirectorSigned && canSign;
                    const canEdit = !isDirectorSigned || (isDirectorSigned && profile.role === 'Direcció');
                    const observacions = item.data[observacionsIndex];

                    return (
                      <tr key={rowIndex}>
                        <td>{item.data[userEmailIndex]}</td>
                        <td>
                          {formatDateForDisplay(item.data[dataIniciIndex])}<br/>
                          {item.data[horaIniciIndex]}
                        </td>
                        <td>
                          {formatDateForDisplay(item.data[dataFiIndex])}<br/>
                          {item.data[horaFiIndex]}
                        </td>
                        <td>{item.data[duracioIndex]}</td>
                        <td>
                          {item.data[tipusIndex]}
                          {observacions && (
                            <span 
                              className="info-icon"
                              onMouseEnter={(e) => handleMouseEnter(e, observacions)}
                              onMouseLeave={handleMouseLeave}
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-info-circle" viewBox="0 0 16 16">
                                <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16"/>
                                <path d="m8.93 6.588-2.29.287-.082.38.45.083c.294.07.352.176.288.469l-.738 3.468c-.194.897.105 1.319.808 1.319.545 0 1.178-.252 1.465-.598l.088-.416c-.2.176-.492.246-.686.246-.275 0-.375-.193-.304-.533zM9 4.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0"/>
                              </svg>
                            </span>
                          )}
                        </td>
                        <td>
                          <input type="checkbox" checked={isUserSigned} readOnly />
                          {isUserSigned && <><br/>{item.data[timestampSignaturaUsuariIndex]}</>}
                        </td>
                        <td>
                          <input type="checkbox" checked={isDirectorSigned} readOnly />
                          {isDirectorSigned && <><br/>{item.data[timestampSignaturaDireccioIndex]}</>}
                        </td>
                        <td>
                          {canEdit && <button
                            className="btn btn-sm btn-primary me-2"
                            onClick={() => handleEditClick(item.data, item.originalSheetRowIndex)}
                          >
                            Editar
                          </button>}
                          {canUserSign && (
                            <button
                              className="btn btn-sm btn-success me-2"
                              onClick={() => handleSignClick(item.data, item.originalSheetRowIndex, 'user')}
                            >
                              Signar (Usuari)
                            </button>
                          )}
                          {canDirectorSign && (
                            <button
                              className="btn btn-sm btn-info"
                              onClick={() => handleSignClick(item.data, item.originalSheetRowIndex, 'director')}
                            >
                              Signar (Direcció)
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <p>No hi ha incidències per mostrar.</p>
            )}
          </>
        )}

        {currentView === 'summary' && (
          <AnnualSummaryView incidents={incidents} profile={profile} />
        )}

        {currentView === 'modified' && (
          <>
            <h3>Incidències modificades després de signar</h3>
            {modifiedIncidents.length > 1 ? (
              <table className="table table-striped">
                <thead>
                  <tr>
                    {processedHeadersModified.map(h => (
                      <th key={h.header}>{h.header}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {modifiedIncidents.slice(1).map((item, rowIndex) => (
                      <tr key={rowIndex}>
                        <td>{item.data[userEmailIndex]}</td>
                        <td>
                          {formatDateForDisplay(item.data[dataIniciIndex])}<br/>
                          {item.data[horaIniciIndex]}
                        </td>
                        <td>
                          {formatDateForDisplay(item.data[dataFiIndex])}<br/>
                          {item.data[horaFiIndex]}
                        </td>
                        <td>{item.data[duracioIndex]}</td>
                        <td>{item.data[tipusIndex]}</td>
                        <td>
                          <input type="checkbox" checked={item.data[signaturaUsuariIndex] === 'TRUE'} readOnly />
                          {item.data[signaturaUsuariIndex] === 'TRUE' && <><br/>{item.data[timestampSignaturaUsuariIndex]}</>}
                        </td>
                        <td>
                          <input type="checkbox" checked={item.data[signaturaDireccioIndex] === 'TRUE'} readOnly />
                          {item.data[signaturaDireccioIndex] === 'TRUE' && <><br/>{item.data[timestampSignaturaDireccioIndex]}</>}
                        </td>
                        <td>
                          <input type="checkbox" checked={item.data[esborratIndex] === 'TRUE'} readOnly />
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            ) : (
              <p>No hi ha incidències modificades per mostrar.</p>
            )}
          </>
        )}

        {currentView === 'documentation' && (
          <DocumentationView accessToken={accessToken} />
        )}

        {editingIncident !== null && (
          <div className="modal" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex="-1">
            <div className="modal-dialog modal-lg">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">{editingIncident.data ? 'Editar Incidència' : 'Afegir Nova Incidència'}</h5>
                  <button type="button" className="btn-close" onClick={handleCloseForm}></button>
                </div>
                <div className="modal-body">
                  <AddIncidentForm
                    incidentToEdit={editingIncident.data}
                    originalSheetRowIndex={editingIncident.originalSheetRowIndex}
                    onSaveIncident={handleSaveIncident}
                    onClose={handleCloseForm}
                    setError={setError}
                    profile={profile}
                    users={users}
                    incidentTypes={incidentTypes}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        <SignatureConfirmPopup
          isOpen={isSignaturePopupOpen}
          onConfirm={handleConfirmSignature}
          onCancel={handleCancelSignature}
          message={`Esteu segur que voleu signar aquesta incidència com a ${signatureType === 'user' ? 'Usuari' : 'Direcció'}?`}
        />

        
      </div>
    );
  }

  const renderScreen = () => {
    switch (currentScreen) {
      case 'login':
        return <LoginView onLogin={login} error={error} />;
      case 'home':
        return <HomeView onIncidentsClick={() => setCurrentScreen('incidents')} onCalendarClick={() => setCurrentScreen('calendar')} onGroupsClick={() => setCurrentScreen('groups')} onTICIncidentsClick={() => setCurrentScreen('tic-incidents')} onMantenimentClick={() => setCurrentScreen('manteniment-incidents')} profile={profile} onLogout={handleLogout} />;
      case 'incidents':
        return <IncidentsView onBackClick={() => setCurrentScreen('home')} />;
      case 'calendar':
        return <CalendarMainView onBackClick={() => setCurrentScreen('home')} accessToken={accessToken} profile={profile} />;
      case 'groups':
        return <MyGroupsView onBackClick={() => setCurrentScreen('home')} accessToken={accessToken} profile={profile} />;
      case 'tic-incidents':
        return <TICIncidentsView onBackClick={() => setCurrentScreen('home')} profile={profile} accessToken={accessToken} users={users} />;
      case 'manteniment-incidents':
        return <MantenimentView onBackClick={() => setCurrentScreen('home')} profile={profile} accessToken={accessToken} users={users} />;
      
      default:
        return <LoginView onLogin={login} error={error} />;
    }
  };

  return (
      <div className="App">
        {renderScreen()}
      </div>
  );
}

function AppWrapper() {
  return (
    <GoogleOAuthProvider clientId={process.env.REACT_APP_GOOGLE_CLIENT_ID}>
      <App />
    </GoogleOAuthProvider>
  );
}

export default AppWrapper;