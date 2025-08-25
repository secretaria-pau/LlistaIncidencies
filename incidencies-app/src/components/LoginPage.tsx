import { GoogleLogin, CredentialResponse } from '@react-oauth/google';
import { useAuth } from '../contexts/AuthContext';

const LoginPage = () => {
  const { login } = useAuth();

  const handleSuccess = (credentialResponse: CredentialResponse) => {
    // The credential response contains the JWT token
    // We'll pass the token to our login function
    if (credentialResponse.credential) {
      login(credentialResponse.credential);
    } else {
      console.error("Login failed: No credential returned from Google");
    }
  };

  const handleError = () => {
    console.error("Login Failed");
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <div>
        <h1>Gestió d'Incidències</h1>
        <p>Si us plau, inicieu sessió per continuar.</p>
        <GoogleLogin
          onSuccess={handleSuccess}
          onError={handleError}
          useOneTap
        />
      </div>
    </div>
  );
};

export default LoginPage;
