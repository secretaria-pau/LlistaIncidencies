import React, { useState, useEffect } from 'react';
import { getSheetData, callGASFunction } from '../googleServices';

const AdminView = ({ config, classrooms, teachers, groups, chats, onUpdateConfig, loading, profile, accessToken, onSyncLists, onUpdateStudents, onUpdateTeachers, onSyncMembers }) => {
  console.log('AdminView - config prop:', config);
  const [studentsError, setStudentsError] = useState(null);
  const [activeTab, setActiveTab] = useState('groups');
  const [selectedTeacher, setSelectedTeacher] = useState('');
  const [editableConfig, setEditableConfig] = useState(config || []);
  console.log('AdminView - editableConfig state (initial):', editableConfig);

  useEffect(() => {
    setEditableConfig(config);
    console.log('AdminView - editableConfig updated by useEffect:', config);
  }, [config]);

  const [students, setStudents] = useState([]);
  const [selectedClassroom, setSelectedClassroom] = useState(null);
  const [loadingStudents, setLoadingStudents] = useState(false);

  const filteredClassrooms = selectedTeacher
    ? classrooms.filter(classroom => {
        return teachers.some(teacher => teacher.email === selectedTeacher && teacher.classroomName === classroom.name);
      })
    : classrooms;

  const activeClassrooms = filteredClassrooms.filter(classroom => {
    const classroomConfig = config.find(c => c[5] === classroom.id) || [];
    return classroomConfig[0] === 'TRUE';
  });

  const handleConfigChange = (e, index, field) => {
    const newConfig = [...editableConfig];
    newConfig[index][field] = e.target.type === 'checkbox' ? e.target.checked.toString().toUpperCase() : e.target.value;
    setEditableConfig(newConfig);
  };

  const handleSaveChanges = () => {
    onUpdateConfig(editableConfig);
  };

  const fetchStudents = async () => {
    setLoadingStudents(true);
    setStudentsError(null);
    try {
      const studentsData = await getSheetData('Alumnes', accessToken);
      setStudents(studentsData);
    } catch (err) {
      setStudentsError(err.message);
    } finally {
      setLoadingStudents(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [accessToken]);

  const handleViewStudents = (classroom) => {
    setSelectedClassroom(classroom);
  };

  const handleCloseStudentsModal = () => {
    setSelectedClassroom(null);
  };

  const handleExportStudents = async (classroom) => { // CAMBIO: Ahora recibe 'classroom'
    const courseName = classroom.name;
    const studentsList = students.filter(student => student[0] === courseName.replace('DEL - ', '')).sort((a, b) => a[1].localeCompare(b[1]));

    // Obtenemos el nombre del grupo
    const groupName = classroom.groupName || 'N/A'; // Asumiendo que classroom.groupName existe

    // Obtenemos los nombres de los profesores para esta clase
    const teachersForClassroom = teachers.filter(teacher => teacher.classroomName === courseName);
    const teacherNames = teachersForClassroom.map(teacher => teacher.name);
    
    console.log(`[Frontend Export] Exporting for course: ${courseName}`); // LOG
    console.log(`[Frontend Export] Received studentsList length: ${studentsList ? studentsList.length : 'null/undefined'}`); // LOG
    if (studentsList && studentsList.length > 0) {
      console.log(`[Frontend Export] First student in studentsList: ${JSON.stringify(studentsList[0])}`); // LOG
    } else {
      console.log(`[Frontend Export] studentsList is empty or null.`); // LOG
    }
    console.log(`[Frontend Export] Group Name: ${groupName}`); // LOG
    console.log(`[Frontend Export] Teacher Names: ${teacherNames.join(', ')}`); // LOG
    console.log(`[Frontend Export] newOwnerEmail (profile.email): ${profile.email}`); // AÑADE ESTA LÍNEA


    try {
      const dataToExport = studentsList.map(student => [student[1], student[2]]);
      
      const response = await callGASFunction('createStudentsSheet', accessToken, {
        courseName: courseName,
        studentsData: JSON.stringify(dataToExport),
        groupName: groupName,
        teacherNames: JSON.stringify(teacherNames),
        newOwnerEmail: profile.email || '' // <--- ESTA ES LA LÍNEA CORRECTA A AÑADIR/MODIFICAR
      });
      
      if (response.success) {
        if (response.url) {
          window.open(response.url, '_blank');
          alert(`Full de càlcul creat i obert en una nova pestanya: ${response.url}`);
        } else {
          alert(response.message);
        }
      } else {
        alert(`Error: ${response.message}`);
      }
    } catch (error) {
      alert(`Error al exportar: ${error.message}`);
      console.error('Error exporting students to Sheets:', error);
    }
  };

 const classroomStudents = selectedClassroom
    ? students.filter(student => student[0] === selectedClassroom.name.replace('DEL - ', '')).sort((a, b) => a[1].localeCompare(b[1]))
    : [];

  // Add logs here to check the values that go into classroomStudents
  console.log(`[Frontend Debug] selectedClassroom.name: ${selectedClassroom ? selectedClassroom.name : 'N/A'}`); // TEMP LOG
  console.log(`[Frontend Debug] Total students loaded (from Alumnes sheet): ${students ? students.length : 'N/A'}`); // TEMP LOG
  if (students && students.length > 0) {
    console.log(`[Frontend Debug] Example student from loaded list: ${JSON.stringify(students[0])}`); // TEMP LOG
  }
  console.log(`[Frontend Debug] classroomStudents length (after filter): ${classroomStudents ? classroomStudents.length : 'N/A'}`); // TEMP LOG
  if (classroomStudents && classroomStudents.length > 0) {
    console.log(`[Frontend Debug] Example classroomStudent: ${JSON.stringify(classroomStudents[0])}`); // TEMP LOG
  }

 

  return (
    <div>
      <div className="mb-4">
        <button onClick={onSyncLists} className="btn btn-primary me-2" disabled={loading}>
          {loading ? 'Sincronitzant...' : 'Sincronitza Llistes'}
        </button>
        <button onClick={onUpdateStudents} className="btn btn-primary me-2" disabled={loading}>
          {loading ? 'Actualitzant...' : 'Actualitza Alumnes'}
        </button>
        <button onClick={onUpdateTeachers} className="btn btn-primary me-2" disabled={loading}>
          {loading ? 'Actualitzant...' : 'Actualitza Professors'}
        </button>
        <button onClick={onSyncMembers} className="btn btn-success" disabled={loading}>
          {loading ? 'Sincronitzant...' : 'Sincronitza Membres'}
        </button>
      </div>

      <ul className="nav nav-tabs">
        <li className="nav-item">
          <button className={`nav-link ${activeTab === 'groups' ? 'active' : ''}`} onClick={() => setActiveTab('groups')}>
            Llistat de grups
          </button>
        </li>
        {profile.role === 'Direcció' && (
          <li className="nav-item">
            <button className={`nav-link ${activeTab === 'config' ? 'active' : ''}`} onClick={() => setActiveTab('config')}>
              Configuració
            </button>
          </li>
        )}
      </ul>

      <div className="tab-content mt-3">
        {activeTab === 'groups' && (
          <div>
            {studentsError && <div className="alert alert-danger">{studentsError}</div>}
            {loadingStudents && <p>Carregant alumnes...</p>}
            <div className="mb-3">
              <label htmlFor="teacher-select" className="form-label">Selecciona un professor:</label>
              <select id="teacher-select" className="form-select" onChange={(e) => setSelectedTeacher(e.target.value)} value={selectedTeacher}>
                <option value="">Tots</option>
                {teachers.map((teacher, index) => (
                  <option key={index} value={teacher.email}>{teacher.name}</option>
                ))}
              </select>
            </div>
            <table className="table table-striped">
              <thead>
                <tr>
                  <th>Nom Classroom</th>
                  <th>Enllaços</th>
                  <th>Alumnes</th>
                </tr>
              </thead>
              <tbody>
                {activeClassrooms.map((classroom, index) => {
                  const classroomConfig = config.find(c => c[5] === classroom.id) || [];
                  return (
                    <tr key={index}>
                      <td>{classroom.name}</td>
                      <td>
                        <a href={classroom.alternateLink} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-primary me-2">Classroom</a>
                        {classroom.chatId ? (
                          <a href={`https://chat.google.com/room/${classroom.chatId.split('/').pop()}`} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-success me-2">Chat</a>
                        ) : (
                          <span className="me-2">N/A</span>
                        )}
                        {classroom.groupUrl ? (
                          <a href={classroom.groupUrl} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-warning">Grup</a>
                        ) : (
                          <span>N/A</span>
                        )}
                      </td>
                      <td>
                        <td>
                          <button className="btn btn-sm btn-info me-2" onClick={() => handleViewStudents(classroom)}>
                            Alumnes
                          </button>
                          <button className="btn btn-sm btn-primary" onClick={() => handleExportStudents(classroom)}>
                           Exportar Alumnes
                          </button>
                        </td>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {selectedClassroom && (
              <div className="modal" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
                {console.log("Modal is rendered for:", selectedClassroom.name)} {/* AÑADE ESTA LÍNEA */}
                <div className="modal-dialog modal-lg">
                  <div className="modal-content">
                    <div className="modal-header">
                      <h5 className="modal-title">Alumnes de {selectedClassroom.name}</h5>
                      <button type="button" className="btn-close" onClick={handleCloseStudentsModal}></button>
                    </div>
                    <div className="modal-body">
                      {classroomStudents.length > 0 ? (
                        <table className="table table-striped">
                          <thead>
                            <tr>
                              <th>Nom Alumne</th>
                              <th>Email Alumne</th>
                            </tr>
                          </thead>
                          <tbody>
                            {classroomStudents.map((student, idx) => (
                              <tr key={idx}>
                                <td>{student[1]}</td>
                                <td>{student[2]}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      ) : (
                        <p>No hi ha alumnes per a aquesta classe.</p>
                      )}
                    </div>
                    <div className="modal-footer">
                      <button type="button" className="btn btn-secondary" onClick={handleCloseStudentsModal}>Tancar</button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
        {activeTab === 'config' && profile.role === 'Direcció' && (
          <div>
            <button className="btn btn-primary mb-3" onClick={handleSaveChanges} disabled={loading}>
              {loading ? 'Guardant...' : 'Guardar Canvis'}
            </button>
            <table className="table table-striped">
              <thead>
                <tr>
                  <th>Actiu</th>
                  <th>Nom Classroom</th>
                  <th>Google Group associat</th>
                  <th>Google Chat associat</th>
                </tr>
              </thead>
              <tbody>
                {editableConfig.map((row, index) => (
                  <tr key={index}>
                    <td><input type="checkbox" checked={row[0] === 'TRUE'} onChange={(e) => handleConfigChange(e, index, 0)} /></td>
                    <td>{row[1]}</td>
                    <td>
                      <select className="form-select" value={row[2]} onChange={(e) => handleConfigChange(e, index, 2)}>
                        <option value="">-</option>
                        {groups.map((group, i) => <option key={i} value={group}>{group}</option>)}
                      </select>
                    </td>
                    <td>
                      <select className="form-select" value={row[3]} onChange={(e) => handleConfigChange(e, index, 3)}>
                        <option value="">-</option>
                        {chats.map((chat, i) => <option key={i} value={chat.displayName}>{chat.displayName}</option>)}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminView;