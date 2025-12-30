import { createContext, useMemo, useState, useEffect } from 'react';

export const AuthContext = createContext({
  token: null,
  profile: null,
  login: () => {},
  logout: () => {},
});

export const AuthProvider = ({ children }) => {
  // Get token and profile based on role
  const getStoredAuth = () => {
    const adminToken = localStorage.getItem('admin_token');
    const studentToken = localStorage.getItem('student_token');
    const adminProfile = localStorage.getItem('admin_profile');
    const studentProfile = localStorage.getItem('student_profile');
    
    // Priority: admin > student
    if (adminToken && adminProfile) {
      return {
        token: adminToken,
        profile: JSON.parse(adminProfile),
      };
    }
    if (studentToken && studentProfile) {
      return {
        token: studentToken,
        profile: JSON.parse(studentProfile),
      };
    }
    return { token: null, profile: null };
  };

  const initialAuth = getStoredAuth();
  const [token, setToken] = useState(initialAuth.token);
  const [profile, setProfile] = useState(initialAuth.profile);

  const login = (newToken, newProfile) => {
    setToken(newToken);
    setProfile(newProfile);
    
    // Store based on role
    if (newProfile?.role === 'admin' || newProfile?.role === 'super-admin') {
      localStorage.setItem('admin_token', newToken);
      localStorage.setItem('admin_profile', JSON.stringify(newProfile));
      // Clear student auth if exists
      localStorage.removeItem('student_token');
      localStorage.removeItem('student_profile');
    } else if (newProfile?.role === 'student') {
      localStorage.setItem('student_token', newToken);
      localStorage.setItem('student_profile', JSON.stringify(newProfile));
      // Clear admin auth if exists
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_profile');
    }
  };

  const logout = () => {
    setToken(null);
    setProfile(null);
    // Clear both admin and student auth
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_profile');
    localStorage.removeItem('student_token');
    localStorage.removeItem('student_profile');
  };

  // Listen for logout events from API interceptor
  useEffect(() => {
    const handleLogout = () => {
      logout();
    };

    window.addEventListener('auth:logout', handleLogout);
    return () => {
      window.removeEventListener('auth:logout', handleLogout);
    };
  }, []);

  const value = useMemo(
    () => ({
      token,
      profile,
      login,
      logout,
      isAuthenticated: Boolean(token),
    }),
    [token, profile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

