import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [companies, setCompanies] = useState([]);
  const [activeCompany, setActiveCompany] = useState(null);

  // Load user status on startup
  useEffect(() => {
    const checkAuthStatus = async () => {
      const token = localStorage.getItem('access_token');
      if (token) {
        try {
          const profileRes = await api.get('/api/auth/me/');
          setUser(profileRes.data.user);
          await loadCompanies();
        } catch (err) {
          console.error("Auth check failed:", err);
          logout();
        }
      }
      setLoading(false);
    };

    checkAuthStatus();
  }, []);

  // Set active company automatically when companies load
  useEffect(() => {
    if (companies.length > 0 && !activeCompany) {
      // Pick first company by default or load from localStorage
      const savedCompanyId = localStorage.getItem('active_company_id');
      const found = companies.find(c => String(c.id) === savedCompanyId);
      if (found) {
        setActiveCompany(found);
      } else {
        setActiveCompany(companies[0]);
      }
    }
  }, [companies]);

  const loadCompanies = async () => {
    try {
      const res = await api.get('/api/companies/');
      setCompanies(res.data.results || res.data);
    } catch (err) {
      console.error("Failed to load companies:", err);
    }
  };

  const changeActiveCompany = (company) => {
    setActiveCompany(company);
    if (company) {
      localStorage.setItem('active_company_id', company.id);
    } else {
      localStorage.removeItem('active_company_id');
    }
  };

 const login = async (username, password) => {
  setLoading(true);
  try {
    const res = await api.post('/api/auth/login/', { username, password });

    localStorage.setItem('access_token', res.data.access);
    localStorage.setItem('refresh_token', res.data.refresh);

    const profileRes = await api.get('/api/auth/me/');
    setUser(profileRes.data.user);

    await loadCompanies();

    setLoading(false);
    return true;
  } catch (err) {
    console.log("Login error:", err);
    setLoading(false);
    return false;
  }
};

 const logout = () => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('active_company_id');

  setUser(null);
  setCompanies([]);
  setActiveCompany(null);

  window.location.href = '/login'; // optional redirect
};

  const value = {
    user,
    loading,
    companies,
    activeCompany,
    changeActiveCompany,
    login,
    logout,
    reloadCompanies: loadCompanies,
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
