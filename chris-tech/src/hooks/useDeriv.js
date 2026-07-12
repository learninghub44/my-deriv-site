import { useAuth } from '../context/AuthContext';

export function useDeriv() {
  const { deriv, status, error, loading, connectDeriv, logout } = useAuth();

  return {
    deriv,
    status,
    error,
    loading,
    connectDeriv,
    logout,
    isConnected: deriv?.isConnected?.() ?? false,
  };
}
