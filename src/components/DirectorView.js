import React, { useState } from 'react';
import { updateConfig, callGASFunction } from '../googleServices';

const DirectorView = ({ config, classrooms, teachers, onSyncLists, onUpdateStudents, onUpdateTeachers, onSyncMembers, loading, accessToken, loadData }) => {
  const [selectedTeacher, setSelectedTeacher] = useState('');
  const [editingClassroom, setEditingClassroom] = useState(null);

  const filteredClassrooms = selectedTeacher
    ? classrooms.filter(classroom => {
        return teachers.some(teacher => teacher.email === selectedTeacher && teacher.classroomName === classroom.name);
      })
    : classrooms;

  const handleEditClick = (classroom) => {
    setEditingClassroom(classroom);
  };

  const handleCloseModal = () => {
    setEditingClassroom(null);
  };

  const handleSaveChanges = async () => {
    if (!editingClassroom) return;

    const newGroup = document.getElementById('group-input').value;
    const newChat = document.getElementById('chat-input').value;

    const newConfig = config.map(row => {
      if (row[5] === editingClassroom.id) {
        return [row[0], row[1], newGroup, newChat, row[4], row[5]];
      }
      return row;
    });

    try {
      await updateConfig(newConfig, accessToken);
      alert('Configuració actualitzada correctament!');
      loadData();
      handleCloseModal();
    } catch (err) {
      alert("Error a l'actualitzar la configuració.");
      console.error(err);
    }
  };

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
            <th>Actiu</th>
            <th>Nom Classroom</th>
            <th>Google Group associat</th>
            <th>Google Chat associat</th>
            <th>Estat Sincronització</th>
            <th>Accions</th>
          </tr>
        </thead>
        <tbody>
          {filteredClassrooms.map((classroom, index) => {
            const classroomConfig = config.find(c => c[5] === classroom.id) || [];
            return (
              <tr key={index}>
                <td><input type="checkbox" checked={classroomConfig[0] === 'TRUE'} /></td>
                <td>{classroom.name}</td>
                <td>{classroomConfig[2]}</td>
                <td>{classroomConfig[3]}</td>
                <td>{classroomConfig[4]}</td>
                <td><button className="btn btn-sm btn-primary" onClick={() => handleEditClick(classroom)}>Editar</button></td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {editingClassroom && (
        <div className="modal" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Editar Classroom: {editingClassroom.name}</h5>
                <button type="button" className="btn-close" onClick={handleCloseModal}></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label htmlFor="group-input" className="form-label">Google Group associat</label>
                  <input type="text" id="group-input" className="form-control" defaultValue={config.find(c => c[5] === editingClassroom.id)[2]} />
                </div>
                <div className="mb-3">
                  <label htmlFor="chat-input" className="form-label">Google Chat associat</label>
                  <input type="text" id="chat-input" className="form-control" defaultValue={config.find(c => c[5] === editingClassroom.id)[3]} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>Tancar</button>
                <button type="button" className="btn btn-primary" onClick={handleSaveChanges}>Guardar Canvis</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DirectorView;
