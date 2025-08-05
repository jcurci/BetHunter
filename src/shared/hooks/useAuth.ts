import { useAuth as useAuthContext } from '../../core/AuthContext';

export const useAuth = () => {
  const auth = useAuthContext();
  
  return {
    ...auth,
    isLoggedIn: auth.isAuthenticated,
    login: auth.login,
    logout: auth.logout,
  };
}; 