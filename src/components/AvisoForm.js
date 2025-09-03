import React, { useState } from 'react';
import { addAviso } from '../avisosService';

const AvisoForm = ({ accessToken, onClose, onAvisoAdded }) => {
  const [titol, setTitol] = useState('');
  const [contingut, setContingut] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!titol || !contingut) {
      setError('El títol i el contingut no poden estar buits.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const payload = { Titol: titol, Contingut: contingut };
      await addAviso(payload, accessToken);
      alert('Avís afegit correctament!');
      onAvisoAdded(); // This will refresh the list in the parent component
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-lg">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Afegir Nou Avís</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <div className="modal-body">
            {error && <div className="alert alert-danger">{error}</div>}
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label htmlFor="titol" className="form-label">Títol</label>
                <input 
                  type="text" 
                  className="form-control" 
                  id="titol" 
                  value={titol}
                  onChange={(e) => setTitol(e.target.value)}
                  required
                />
              </div>
              <div className="mb-3">
                <label htmlFor="contingut" className="form-label">Contingut</label>
                <textarea 
                  className="form-control" 
                  id="contingut" 
                  rows="10"
                  value={contingut}
                  onChange={(e) => setContingut(e.target.value)}
                  required
                ></textarea>
                <small className="form-text text-muted fw-bold text-info"> 
                  Pots fer servir etiquetes HTML bàsiques com ara &lt;b&gt;negreta&lt;/b&gt;, &lt;i&gt;cursiva&lt;/i&gt;, i &lt;a href="..."&gt;enllaços&lt;/a&gt;.
                </small>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel·lar</button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Guardant...' : 'Guardar Avís'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AvisoForm;