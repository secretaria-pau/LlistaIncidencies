import { useAuth } from '../contexts/AuthContext';
import IncidentsList from './IncidentsList';
import Reports from './Reports';

const MainApp = () => {
  const { logout } = useAuth();

  return (
    <div style={{ padding: '2rem' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1>Portal d'Incidències</h1>
        <button onClick={logout}>Tancar Sessió</button>
      </header>
      <main style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
        <div>
          <IncidentsList />
        </div>
        <div>
          <Reports />
        </div>
      </main>
    </div>
  );
};

export default MainApp;
