import React, { useState, useEffect } from 'react';
import { getIncidentTypes, getUsers } from '../googleSheetsService';

const DocumentationView = ({ accessToken }) => {
  const [incidentTypes, setIncidentTypes] = useState([]);
  const [users, setUsers] = useState([]); // New state for users
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [usersLoading, setUsersLoading] = useState(true); // New state for users loading
  const [usersError, setUsersError] = useState(null); // New state for users error

  useEffect(() => {
    const fetchIncidentTypes = async () => {
      try {
        const data = await getIncidentTypes(accessToken);
        setIncidentTypes(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    const fetchUsers = async () => { // New function to fetch users
      try {
        const data = await getUsers(accessToken);
        setUsers(data);
      } catch (err) {
        setUsersError(err.message);
      } finally {
        setUsersLoading(false);
      }
    };

    if (accessToken) {
      fetchIncidentTypes();
      fetchUsers(); // Call fetchUsers
    }
  }, [accessToken]);

  return (
    <div className="mt-4">
      <h3>Documentació de l'Aplicació d'Incidències</h3>
      <hr />

      <h4>Rols d'Usuari i Permisos</h4>
      <p>
        Aquesta aplicació utilitza un sistema de rols per gestionar l'accés a les diferents funcionalitats. 
        A continuació es detallen els permisos de cada rol:
      </p>
      <h5 className="mt-3">Usuaris Autoritzats</h5>
      {usersLoading && <p>Cargando usuarios...</p>}
      {usersError && <p className="text-danger">Error al cargar usuarios: {usersError}</p>}
      {!usersLoading && !usersError && users.length === 0 && <p>No se encontraron usuarios autorizados.</p>}
      {!usersLoading && !usersError && users.length > 0 && (
        <table className="table table-bordered table-striped">
          <thead>
            <tr>
              <th>Nom d'Usuari</th>
              <th>Rol</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user, index) => (
              <tr key={index}>
                <td>{user.name}</td>
                <td>{user.role}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <h4 className="mt-4">Funcionalitat de cada Pestaña</h4>
      <p>A continuació es descriu la funcionalitat principal de cada secció de l'aplicació:</p>
      <ul>
        <li><strong>Pestaña de Incidencias (AddIncidentForm)</strong>: Permite a los usuarios registrar nuevas incidencias, especificando detalles como tipo, descripción y duración.</li>
        <li><strong>Pestaña de Resumen Anual (AnnualSummaryView)</strong>: Ofrece una vista consolidada de las incidencias registradas a lo largo del año, con opciones de filtrado por usuario y tipo de incidencia.</li>
        <li><strong>Pestaña de Documentación (DocumentationView)</strong>: Proporciona información detallada sobre el uso de la aplicación, roles de usuario, tipos de incidencia y otras guías relevantes.</li>
      </ul>

      <div className="accordion" id="rolesAccordion">
        <div className="accordion-item">
          <h2 className="accordion-header" id="headingOne">
            <button className="accordion-button" type="button" data-bs-toggle="collapse" data-bs-target="#collapseOne" aria-expanded="true" aria-controls="collapseOne">
              <strong>1. Usuari</strong>
            </button>
          </h2>
          <div id="collapseOne" className="accordion-collapse collapse show" aria-labelledby="headingOne" data-bs-parent="#rolesAccordion">
            <div className="accordion-body">
              <p>El rol d'<strong>Usuari</strong> està pensat per al personal que ha de registrar les seves pròpies incidències.</p>
              <ul>
                <li><strong>Veure incidències</strong>: Només pot veure les seves pròpies incidències.</li>
                <li><strong>Crear incidències</strong>: Pot crear noves incidències per a si mateix.</li>
                <li><strong>Editar incidències</strong>: Pot editar les seves pròpies incidències, sempre que no estiguin signades por la Direcció. Si una incidència ja ha estat signada (per l'usuari o la direcció) i s'edita, l'original se marcará como a "modificada" i se'n crearà una de nova amb els canvis.</li>
                <li><strong>Signar incidències</strong>: Pot signar les seves pròpies incidències si encara no han estat signades per ningú. La signatura d'usuari és un pas de validació inicial.</li>
                <li><strong>Resum Anual</strong>: Pot veure un resum anual de les seves pròpies incidències.</li>
                <li><strong>Incidències Modificades</strong>: Pot veure un llistat de les seves incidències que han estat modificades después de ser signades.</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="accordion-item">
          <h2 className="accordion-header" id="headingTwo">
            <button className="accordion-button" type="button" data-bs-toggle="collapse" data-bs-target="#collapseTwo" aria-expanded="false" aria-controls="collapseTwo">
              <strong>2. Gestor</strong>
            </button>
          </h2>
          <div id="collapseTwo" className="accordion-collapse collapse" aria-labelledby="headingTwo" data-bs-parent="#rolesAccordion">
            <div className="accordion-body">
              <p>El rol de <strong>Gestor</strong> té permisos per supervisar les incidències de tots els usuaris, però no pot validar-les finalment.</p>
              <ul>
                <li><strong>Veure incidències</strong>: Pot veure les incidències de <strong>tots</strong> els usuaris. Pot filtrar per usuari o per any.</li>
                <li><strong>Crear i Editar incidències</strong>: Pot crear i editar incidències per a qualsevol usuari. S'aplica la mateixa lògica de "modificació" si edita una incidència ya signada.</li>
                <li><strong>Signar incidències</strong>: <strong>No pot</strong> signar incidències. La signatura està reservada als Usuaris i a la Direcció.</li>
                <li><strong>Resum Anual</strong>: Pot veure un resum anual de les incidències de tots els usuaris.</li>
                <li><strong>Incidències Modificades</strong>: Pot veure el llistat de <strong>totes</strong> les incidències que han estat modificades después de ser signades.</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="accordion-item">
          <h2 className="accordion-header" id="headingThree">
            <button className="accordion-button" type="button" data-bs-toggle="collapse" data-bs-target="#collapseThree" aria-expanded="false" aria-controls="collapseThree">
              <strong>3. Direcció</strong>
            </button>
          </h2>
          <div id="collapseThree" className="accordion-collapse collapse" aria-labelledby="headingThree" data-bs-parent="#rolesAccordion">
            <div className="accordion-body">
              <p>El rol de <strong>Direcció</strong> té el control total de l'aplicació, incloent la validació final de les incidències.</p>
              <ul>
                <li><strong>Veure incidències</strong>: Pot veure les incidències de <strong>tots</strong> els usuaris. Pot filtrar per usuari o per any.</li>
                <li><strong>Crear i Editar incidències</strong>: Pot crear i editar incidències per a qualsevol usuari. Si edita una incidència signada per la direcció, l'original se marcará como a "modificada" i se'n crearà una de nova.</li>
                <li><strong>Signar incidències</strong>: Pot signar qualsevol incidència com a validació final (`Signatura Direcció`). Aquesta signatura bloqueja l'edició per part dels Usuaris.</li>
                <li><strong>Resum Anual</strong>: Pot veure un resum anual de les incidències de tots els usuaris.</li>
                <li><strong>Incidències Modificades</strong>: Pot veure el llistat de <strong>totes</strong> les incidències que han estat modificades después de ser signades.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <h4 className="mt-4">Tipus d'Incidència i Documentació Associada</h4>
      {loading && <p>Cargando tipos de incidencia...</p>}
      {error && <p className="text-danger">Error: {error}</p>}
      {!loading && !error && incidentTypes.length === 0 && <p>No se encontraron tipos de incidencia.</p>}
      {!loading && !error && incidentTypes.length > 0 && (
        <table className="table table-bordered table-striped" style={{ tableLayout: 'fixed', width: '100%' }}>
          <thead>
            <tr>
              <th style={{ width: '20%' }}>Nom del Tipus</th>
              <th style={{ width: '40%' }}>Descripció</th>
              <th style={{ width: '40%' }}>Notes sobre la Durada</th>
            </tr>
          </thead>
          <tbody>
            {incidentTypes.map((type, index) => (
              <tr key={index}>
                <td>{type.type}</td>
                <td style={{ width: '40%' }}>{type.description}</td>
                <td>
                  {type.durationUnit === 'H' && (
                    <p>Les incidències són només d'un dia. Cal introduir la data d'inici i les hores d'inici i final.</p>
                  )}
                  {type.durationUnit === 'D' && (
                    <p>Les incidències poden ser d'un o més dies. Cal introduir la data d'inici i la data de final (si és diferent). Les hores no són rellevants per al càlcul de la durada.</p>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default DocumentationView;