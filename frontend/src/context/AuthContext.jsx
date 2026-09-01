import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { authStateRef } from '../api/axios';
import { loginUser, signupUser, logoutUser, refreshAccessToken } from '../api/authApi';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Mutable refs to keep axios interceptors in sync without stale closures
  const accessTokenRef = useRef(accessToken);
  accessTokenRef.current = accessToken;

  const handleLogout = async () => {
    try {
      if (accessTokenRef.current) {
        await logoutUser();
      }
    } catch {
      // Ignore network errors on logout
    } finally {
      setUser(null);
      setAccessToken(null);
    }
  };

  const handleLogoutRef = useRef(handleLogout);
  handleLogoutRef.current = handleLogout;

  // Register access token getter/setter and logout callback on the shared axios ref
  useEffect(() => {
    authStateRef.getAccessToken = () => accessTokenRef.current;
    authStateRef.setAccessToken = (newToken) => {
      setAccessToken(newToken);
    };
    authStateRef.onLogout = () => {
      handleLogoutRef.current();
    };
  }, []);

  // Try silent refresh on initial application load
  useEffect(() => {
    let isMounted = true;

    const initAuth = async () => {
      try {
        const response = await refreshAccessToken();
        if (isMounted && response?.data?.accessToken) {
          setAccessToken(response.data.accessToken);
          // If the backend returns user object or we have token, we set state
          if (response.data.user) {
            setUser(response.data.user);
          }
        }
      } catch {
        // Not logged in or expired refresh token
        if (isMounted) {
          setUser(null);
          setAccessToken(null);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    initAuth();

    return () => {
      isMounted = false;
    };
  }, []);

  const login = async (credentials) => {
    const response = await loginUser(credentials);
    if (response?.data) {
      setUser(response.data.user);
      setAccessToken(response.data.accessToken);
    }
    return response;
  };

  const signup = async (userData) => {
    const response = await signupUser(userData);
    if (response?.data) {
      setUser(response.data.user);
      setAccessToken(response.data.accessToken);
    }
    return response;
  };

  const value = {
    user,
    accessToken,
    isAuthenticated: Boolean(user && accessToken),
    isLoading,
    login,
    signup,
    logout: handleLogout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
