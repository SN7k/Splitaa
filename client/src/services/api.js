﻿/**
 * API Service Layer - Connected to PHP Backend
 * All API calls connect to the real backend running on http://localhost:8000
 */

// API Configuration
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

// Helper function to get auth token
const getAuthToken = () => {
  return localStorage.getItem('auth_token');
};

// Helper function to get current user from localStorage
const getStoredUser = () => {
  const user = localStorage.getItem('current_user');
  return user ? JSON.parse(user) : null;
};

// Helper function to make authenticated requests
const apiRequest = async (endpoint, options = {}) => {
  const token = getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.message || 'API request failed');
    }

    return data.data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

// ===== Authentication =====
export const loginUser = async (email, password) => {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await response.json();
  if (data.success) {
    localStorage.setItem('auth_token', data.data.token);
    localStorage.setItem('current_user', JSON.stringify(data.data.user));
    return data.data;
  } else {
    throw new Error(data.message || 'Login failed');
  }
};

export const registerUser = async (name, email, password, phone) => {
  const response = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password, phone }),
  });
  const data = await response.json();
  if (data.success) {
    localStorage.setItem('auth_token', data.data.token);
    localStorage.setItem('current_user', JSON.stringify(data.data.user));
    return data.data;
  } else {
    throw new Error(data.message || 'Registration failed');
  }
};

export const getCurrentUser = async () => {
  const storedUser = getStoredUser();
  if (storedUser) return storedUser;
  try {
    const user = await apiRequest('/auth/me');
    localStorage.setItem('current_user', JSON.stringify(user));
    return user;
  } catch (error) {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('current_user');
    throw error;
  }
};

export const logoutUser = () => {
  localStorage.removeItem('auth_token');
  localStorage.removeItem('current_user');
};

export const isAuthenticated = () => !!getAuthToken();

// ===== Groups =====
export const getGroups = async () => await apiRequest('/groups');

export const getGroup = async (id) => await apiRequest(`/groups/${id}`);

export const createGroup = async (groupData) => {
  return await apiRequest('/groups', {
    method: 'POST',
    body: JSON.stringify(groupData),
  });
};

export const addGroupMember = async (groupId, userId) => {
  return await apiRequest(`/groups/${groupId}/add-member`, {
    method: 'POST',
    body: JSON.stringify({ userId }),
  });
};

export const deleteGroup = async (id) => {
  return await apiRequest(`/groups/${id}`, {
    method: 'DELETE',
  });
};

// ===== Expenses =====
export const getAllExpenses = async () => await apiRequest('/expenses');

export const getGroupExpenses = async (groupId) => await apiRequest(`/groups/${groupId}/expenses`);

export const createExpense = async (expenseData) => {
  return await apiRequest('/expenses', {
    method: 'POST',
    body: JSON.stringify(expenseData),
  });
};

export const updateExpense = async (id, expenseData) => {
  return await apiRequest(`/expenses/${id}`, {
    method: 'PUT',
    body: JSON.stringify(expenseData),
  });
};

export const deleteExpense = async (id) => {
  return await apiRequest(`/expenses/${id}`, {
    method: 'DELETE',
  });
};

// ===== Group Members =====
export const getGroupMembers = async (groupId) => await apiRequest(`/groups/${groupId}/members`);

export const addGroupMemberByEmail = async (groupId, email) => {
  return await apiRequest(`/groups/${groupId}/add-member`, {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
};

export const removeGroupMember = async (groupId, userId) => {
  return await apiRequest(`/groups/${groupId}/members/${userId}`, {
    method: 'DELETE',
  });
};

// ===== Settlements =====
export const getSettlements = async () => await apiRequest('/settlements');

export const createSettlement = async (settlementData) => {
  return await apiRequest('/settlements', {
    method: 'POST',
    body: JSON.stringify(settlementData),
  });
};

export const calculateBalances = async () => await apiRequest('/settlements/calculate');

// ===== Categories =====
export const getCategories = async () => {
  // Categories are static for now
  return Promise.resolve([
    { id: 1, name: 'Food & Dining', icon: '🍽️' },
    { id: 2, name: 'Transportation', icon: '🚗' },
    { id: 3, name: 'Entertainment', icon: '🎬' },
    { id: 4, name: 'Shopping', icon: '🛍️' },
    { id: 5, name: 'Utilities', icon: '💡' },
    { id: 6, name: 'Rent', icon: '🏠' },
    { id: 7, name: 'Healthcare', icon: '⚕️' },
    { id: 8, name: 'Other', icon: '📦' },
  ]);
};

// ===== Payment Methods =====
export const getPaymentMethods = async () => await apiRequest('/payment-methods');

export const createPaymentMethod = async (methodData) => {
  return await apiRequest('/payment-methods', {
    method: 'POST',
    body: JSON.stringify(methodData),
  });
};

export const updatePaymentMethod = async (id, methodData) => {
  return await apiRequest(`/payment-methods/${id}`, {
    method: 'PUT',
    body: JSON.stringify(methodData),
  });
};

export const deletePaymentMethod = async (id) => {
  return await apiRequest(`/payment-methods/${id}`, {
    method: 'DELETE',
  });
};

export const setPrimaryPaymentMethod = async (id) => {
  return await apiRequest(`/payment-methods/${id}/set-primary`, {
    method: 'PUT',
  });
};

export const getUserPaymentMethods = async (userId) => {
  return await apiRequest(`/users/${userId}/payment-methods`);
};

export default {
  loginUser,
  registerUser,
  getCurrentUser,
  logoutUser,
  isAuthenticated,
  getGroups,
  getGroup,
  createGroup,
  addGroupMember,
  deleteGroup,
  getAllExpenses,
  getGroupExpenses,
  createExpense,
  updateExpense,
  deleteExpense,
  getGroupMembers,
  addGroupMemberByEmail,
  removeGroupMember,
  getSettlements,
  createSettlement,
  calculateBalances,
  getCategories,
  getPaymentMethods,
  createPaymentMethod,
  updatePaymentMethod,
  deletePaymentMethod,
  setPrimaryPaymentMethod,
  getUserPaymentMethods,
};
