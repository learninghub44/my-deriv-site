import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';

export function useAuthorize() {
  const { deriv, status, error, loading, connectDeriv, authorize, logout, isAuthenticated } = useAuth();
  const [authError, setAuthError] = useState(error);

  useEffect(() => {
    setAuthError(error);
  }, [error]);

  const authorizeConnection = async () => {
    if (!deriv) {
      throw new Error('Deriv instance is not initialized yet');
    }

    if (!deriv.isConnected()) {
      await deriv.connect();
    }

    return deriv.authorize();
  };

  return {
    deriv,
    status,
    error: authError,
    loading,
    connectDeriv,
    authorize: authorizeConnection,
    logout,
    isAuthenticated,
  };
}
