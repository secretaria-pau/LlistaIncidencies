import React from 'react';

const LoginView = ({ onLogin, error }) => {
  return (
    <div className="container vh-100 d-flex justify-content-center align-items-center">
      <div className="card text-center p-4 shadow">
        <div className="card-body">
          <h1 className="card-title">App Gestió CFA LA PAU</h1>
          <p className="card-text">Si us plau, inicieu sessió con Google</p>
          <button onClick={onLogin} className="btn btn-primary">Accedir con Google</button>
          {error && <p className="text-danger mt-3">{error}</p>}
        </div>
      </div>
    </div>
  );
};

export default LoginView;
