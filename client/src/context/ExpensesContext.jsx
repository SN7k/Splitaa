import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { getCurrentUser, getGroups, getSettlements, getAllExpenses } from '../services/api';

const ExpensesContext = createContext();

const initialState = {
  groups: [],
  currentGroup: null,
  expenses: [],
  friends: [],
  settlements: [],
  currentUser: null,
  loading: true,
  error: null
};

function expensesReducer(state, action) {
  switch (action.type) {
    case 'SET_LOADING':
      return {
        ...state,
        loading: action.payload
      };
    
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        loading: false
      };
    
    case 'ADD_GROUP':
      return {
        ...state,
        groups: [...state.groups, { ...action.payload, id: Date.now() }]
      };
    
    case 'UPDATE_GROUP':
      return {
        ...state,
        groups: state.groups.map(group => 
          group.id === action.payload.id ? { ...group, ...action.payload } : group
        )
      };
    
    case 'DELETE_GROUP':
      return {
        ...state,
        groups: state.groups.filter(group => group.id !== action.payload)
      };
    
    case 'SET_CURRENT_GROUP':
      return {
        ...state,
        currentGroup: action.payload
      };
    
    case 'ADD_FRIEND':
      return {
        ...state,
        friends: [...state.friends, { ...action.payload, id: Date.now() }]
      };
    
    case 'UPDATE_FRIEND':
      return {
        ...state,
        friends: state.friends.map(friend =>
          friend.id === action.payload.id ? { ...friend, ...action.payload } : friend
        )
      };
    
    case 'DELETE_FRIEND':
      return {
        ...state,
        friends: state.friends.filter(friend => friend.id !== action.payload)
      };
    
    case 'ADD_EXPENSE':
      return {
        ...state,
        expenses: [...state.expenses, { ...action.payload, id: Date.now(), date: new Date() }]
      };
    
    case 'UPDATE_EXPENSE':
      return {
        ...state,
        expenses: state.expenses.map(expense =>
          expense.id === action.payload.id ? { ...expense, ...action.payload } : expense
        )
      };
    
    case 'DELETE_EXPENSE':
      return {
        ...state,
        expenses: state.expenses.filter(expense => expense.id !== action.payload)
      };
    
    case 'ADD_SETTLEMENT':
      return {
        ...state,
        settlements: [...state.settlements, { ...action.payload, id: Date.now(), date: new Date() }]
      };
    
    case 'UPDATE_SETTLEMENT':
      return {
        ...state,
        settlements: state.settlements.map(settlement =>
          settlement.id === action.payload.id ? { ...settlement, ...action.payload } : settlement
        )
      };
    
    case 'DELETE_SETTLEMENT':
      return {
        ...state,
        settlements: state.settlements.filter(settlement => settlement.id !== action.payload)
      };
    
    // For bulk updates when data is loaded from API
    case 'SET_ALL_DATA':
      return {
        ...state,
        currentUser: action.payload.currentUser || state.currentUser,
        groups: action.payload.groups || state.groups,
        expenses: action.payload.expenses || state.expenses,
        friends: action.payload.friends || state.friends,
        settlements: action.payload.settlements || state.settlements,
        loading: false
      };
    
    default:
      return state;
  }
}

export const ExpensesProvider = ({ children }) => {
  const [state, dispatch] = useReducer(expensesReducer, initialState);

  const loadData = async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        dispatch({ type: 'SET_LOADING', payload: false });
        return;
      }


      const [currentUser, groups, expenses, settlements] = await Promise.all([
        getCurrentUser().catch(err => { return null; }),
        getGroups().catch(err => { return []; }),
        getAllExpenses().catch(err => { return []; }),
        getSettlements().catch(err => { return []; })
      ]);
      
      dispatch({
        type: 'SET_ALL_DATA',
        payload: { currentUser, friends: [], groups, expenses, settlements }
      });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
    }
  };

  useEffect(() => {
    loadData();

    const handleStorageChange = (e) => {
      if (e.key === 'auth_token') {
        loadData();
      }
    };

    // Listen for auth token changes
    const handleAuthChange = () => {
      loadData();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('auth-changed', handleAuthChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('auth-changed', handleAuthChange);
    };
  }, []);

  return (
    <ExpensesContext.Provider value={{ state, dispatch, refreshData: loadData }}>
      {children}
    </ExpensesContext.Provider>
  );
};

export const useExpenses = () => {
  const context = useContext(ExpensesContext);
  if (!context) {
    throw new Error('useExpenses must be used within an ExpensesProvider');
  }
  return context;
};
