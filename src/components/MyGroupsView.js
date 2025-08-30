import React, { useState, useEffect } from 'react';
import { getConfig, getSheetData, updateConfig, callGASFunction } from '../googleServices';
import AdminView from './AdminView';
import UserGroupsView from './UserGroupsView';

const MyGroupsView = ({ onBackClick, accessToken, profile }) => {
  const [config, setConfig] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadData = async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      const [configData, classroomsData, teachersData, groupsData, chatsData] = await Promise.all([
        getConfig(accessToken),
        getSheetData('Llista Classrooms', accessToken),
        getSheetData('Professors', accessToken),
        getSheetData('Llista Groups', accessToken),
        getSheetData('Llista Chats', accessToken),
      ]);
      // console.log('Config data loaded:', configData);
      setConfig(configData);

      // Store both display name and ID for chats
      setChats(chatsData.map(row => ({ displayName: row[0], id: row[2] })));

      // Store group emails for the dropdown, and also map group emails to their URLs
      const groupEmails = groupsData.map(row => row[0]);
      setGroups(groupEmails); // For the dropdown
      const groupUrlMap = new Map(groupsData.map(row => [row[0], row[1]])); // Map email to URL

      // Map classrooms, enriching with groupName, chatName, chatId, and groupUrl
      setClassrooms(classroomsData.map(row => {
        const classroomId = row[2];
        const configEntry = configData.find(c => c[5] === classroomId);
        const groupEmail = configEntry ? configEntry[2] : '';
        return {
          name: row[0],
          alternateLink: row[1],
          id: classroomId,
          groupName: groupEmail, // This is the group email
          groupUrl: groupUrlMap.get(groupEmail) || '', // Get group URL from the map
          chatName: configEntry ? configEntry[3] : '',
          chatId: configEntry ? chatsData.find(chatRow => chatRow[0] === configEntry[3])?.[2] : '', // Get chat ID from chatsData
        };
      }));

      setTeachers(teachersData.map(row => ({ name: row[1], email: row[2], classroomName: row[0] })));

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [accessToken]);

  const handleUpdateConfig = async (newConfig) => {
    if (!accessToken) return;
    setLoading(true);
    setError(null);
    try {
      await updateConfig(newConfig, accessToken);
      alert('Configuració actualitzada correctament!');
      loadData(); // Reload data to show changes
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSyncLists = async () => {
    setLoading(true);
    setError(null);
    try {
      await callGASFunction('actualitzarLlistes', accessToken);
      alert(`Sincronització de llistes iniciada. Revisa la teva fulla de càlcul per l'estat.`);
      loadData(); // Reload data after assuming success
    } catch (err) {
      setError("Error en iniciar la sincronització de llistes. Revisa la consola per a més detalls.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStudents = async () => {
    setLoading(true);
    setError(null);
    try {
      await callGASFunction('actualitzarAlumnes', accessToken);
      alert(`Actualització d'alumnes iniciada. Revisa la teva fulla de càlcul per l'estat.`);
      loadData();
    } catch (err) {
      setError("Error en iniciar l'actualització d'alumnes. Revisa la consola per a més detalls.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateTeachers = async () => {
    setLoading(true);
    setError(null);
    try {
      await callGASFunction('actualitzarProfessors', accessToken);
      alert(`Actualització de professors iniciada. Revisa la teva fulla de càlcul per l'estat.`);
      loadData();
    } catch (err) {
      setError("Error en iniciar l'actualització de professors. Revisa la consola per a més detalls.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSyncMembers = async () => {
    setLoading(true);
    setError(null);
    try {
      await callGASFunction('sincronitzarMembres', accessToken);
      alert(`Sincronització de membres iniciada. Revisa la teva fulla de càlcul per l'estat.`);
      loadData();
    } catch (err) {
      setError("Error en iniciar la sincronització de membres. Revisa la consola per a més detalls.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const renderViewByRole = () => {
    if (!profile) return null;

    switch (profile.role) {
      case 'Usuari':
        return <UserGroupsView classrooms={classrooms} teachers={teachers} profile={profile} accessToken={accessToken} />;
      case 'Gestor':
      case 'Direcció':
        return <AdminView
          config={config}
          classrooms={classrooms}
          teachers={teachers}
          groups={groups}
          chats={chats}
          onUpdateConfig={handleUpdateConfig}
          loading={loading}
          profile={profile}
          accessToken={accessToken}
          onSyncLists={handleSyncLists}
          onUpdateStudents={handleUpdateStudents}
          onUpdateTeachers={handleUpdateTeachers}
          onSyncMembers={handleSyncMembers}
        />;
      default:
        return null;
    }
  };

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Els meus grups</h2>
        <div className="d-flex align-items-center">
          <div className="text-end me-3">
            <div><strong>{profile.name}</strong> ({profile.role})</div>
            <div><small>{profile.email}</small></div>
          </div>
          <button onClick={onBackClick} className="btn btn-secondary">Tornar</button>
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      {loading && <p>Carregant...</p>}

      {renderViewByRole()}
    </div>
  );
};

export default MyGroupsView;
