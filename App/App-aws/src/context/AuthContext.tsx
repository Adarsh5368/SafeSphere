import React, { createContext, useContext, useReducer, useEffect, useRef, ReactNode } from 'react';
import { type UserType } from '../utils/constants';

// User interface
export interface User {
  _id: string;
  email: string;
  name: string;
  userType: UserType;
  parentId?: string;
  childIds?: string[];
  familyCode?: string;
  phone?: string;
  profilePhoto?: string;
  isActive: boolean;
  age?: number;
  lastLogin: string;
}

// Auth state interface
interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
}

// Auth actions
type AuthAction =
  | { type: 'LOGIN_START' }
  | { type: 'LOGIN_SUCCESS'; payload: User }
  | { type: 'LOGIN_ERROR'; payload: string }
  | { type: 'LOGOUT' }
  | { type: 'UPDATE_USER'; payload: Partial<User> }
  | { type: 'CLEAR_ERROR' };

// Initial state
const initialState: AuthState = {
  user: null,
  isLoading: true,
  isAuthenticated: false,
  error: null,
};

// Auth reducer
const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'LOGIN_START':
      return {
        ...state,
        isLoading: true,
        error: null,
      };
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        user: action.payload,
        isLoading: false,
        isAuthenticated: true,
        error: null,
      };
    case 'LOGIN_ERROR':
      return {
        ...state,
        user: null,
        isLoading: false,
        isAuthenticated: false,
        error: action.payload,
      };
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        isLoading: false,
        isAuthenticated: false,
        error: null,
      };
    case 'UPDATE_USER':
      return {
        ...state,
        user: state.user ? { ...state.user, ...action.payload } : null,
      };
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
      };
    default:
      return state;
  }
};

// Auth context interface
interface AuthContextType extends AuthState {
  login: (email: string, password: string, familyCode?: string) => Promise<void>;
  logout: () => Promise<void>;
  signup: (userData: {
    email: string;
    name: string;
    password: string;
    userType: UserType;
    familyCode?: string;
    phone?: string;
  }) => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (email: string, confirmationCode: string, newPassword: string) => Promise<void>;
  updateUser: (userData: Partial<User>) => void;
  clearError: () => void;
  checkSession: () => Promise<void>;
}

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth provider props
interface AuthProviderProps {
  children: ReactNode;
}

// Auth provider component
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);
  const hasCheckedSession = useRef(false);

  // Login function (using Express API)
  const login = async (email: string, password: string, familyCode?: string): Promise<void> => {
    try {
      dispatch({ type: 'LOGIN_START' });
      
      // Use Express API instead of Amplify
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email, password, familyCode }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Login failed');
      }

      const result = await response.json();
      
      // Map Express response to app user format
      const user: User = {
        _id: result.data.user._id,
        email: result.data.user.email,
        name: result.data.user.name,
        userType: result.data.user.userType,
        parentId: result.data.user.parentId,
        childIds: result.data.user.childIds || [],
        familyCode: result.data.user.familyCode,
        phone: result.data.user.phone,
        profilePhoto: result.data.user.profilePhoto,
        isActive: result.data.user.isActive,
        age: result.data.user.age,
        lastLogin: new Date().toISOString(),
      };

      dispatch({ type: 'LOGIN_SUCCESS', payload: user });
    } catch (error: any) {
      console.error('Login error:', error);
      const message = error instanceof Error ? error.message : 'Login failed';
      dispatch({ type: 'LOGIN_ERROR', payload: message });
      throw error;
    }
  };

  // Signup function (using Express API)
  const signup = async (userData: {
    email: string;
    name: string;
    password: string;
    userType: UserType;
    familyCode?: string;
    phone?: string;
  }): Promise<void> => {
    try {
      dispatch({ type: 'LOGIN_START' });
      
      // Use Express API instead of Amplify
      const response = await fetch('http://localhost:5000/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Registration failed');
      }

      const result = await response.json();
      
      // Map Express response to app user format
      const user: User = {
        _id: result.data.user._id,
        email: result.data.user.email,
        name: result.data.user.name,
        userType: result.data.user.userType,
        parentId: result.data.user.parentId,
        childIds: result.data.user.childIds || [],
        familyCode: result.data.user.familyCode,
        phone: result.data.user.phone,
        profilePhoto: result.data.user.profilePhoto,
        isActive: result.data.user.isActive,
        age: result.data.user.age,
        lastLogin: result.data.user.lastLogin || new Date().toISOString(),
      };

      dispatch({ type: 'LOGIN_SUCCESS', payload: user });
    } catch (error: any) {
      console.error('Signup error:', error);
      const message = error instanceof Error ? error.message : 'Registration failed';
      dispatch({ type: 'LOGIN_ERROR', payload: message });
      throw error;
    }
  };

  // Logout function
  const logout = async (): Promise<void> => {
    try {
      await fetch('http://localhost:5000/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      dispatch({ type: 'LOGOUT' });
    }
  };

  // Forgot password function
  const forgotPassword = async (email: string): Promise<void> => {
    try {
      const response = await fetch('http://localhost:5000/api/auth/forgotPassword', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to send password reset email');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to send password reset email';
      throw new Error(message);
    }
  };

  // Reset password function
  const resetPassword = async (email: string, token: string, newPassword: string): Promise<void> => {
    try {
      const response = await fetch(`http://localhost:5000/api/auth/resetPassword/${token}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ password: newPassword }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to reset password');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to reset password';
      throw new Error(message);
    }
  };

  // Check session function
  const checkSession = async (): Promise<void> => {
    try {
      dispatch({ type: 'LOGIN_START' });
      
      // Check authentication with Express API
      const response = await fetch('http://localhost:5000/api/auth/me', {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        dispatch({ type: 'LOGIN_ERROR', payload: 'Session expired' });
        return;
      }

      const result = await response.json();
      
      // Map Express response to app user format
      const user: User = {
        _id: result.data.user._id,
        email: result.data.user.email,
        name: result.data.user.name,
        userType: result.data.user.userType,
        parentId: result.data.user.parentId,
        childIds: result.data.user.childIds || [],
        familyCode: result.data.user.familyCode,
        phone: result.data.user.phone,
        profilePhoto: result.data.user.profilePhoto,
        isActive: result.data.user.isActive,
        age: result.data.user.age,
        lastLogin: result.data.user.lastLogin || new Date().toISOString(),
      };

      dispatch({ type: 'LOGIN_SUCCESS', payload: user });
    } catch (error) {
      console.error('Session check error:', error);
      dispatch({ type: 'LOGIN_ERROR', payload: 'Session check failed' });
    }
  };

  // Update user function
  const updateUser = (userData: Partial<User>) => {
    dispatch({ type: 'UPDATE_USER', payload: userData });
  };

  // Clear error function
  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  // Check session on mount
  useEffect(() => {
    // Prevent duplicate session checks in React Strict Mode
    if (hasCheckedSession.current) {
      return;
    }
    
    hasCheckedSession.current = true;
    
    // Only check session if not on auth pages
    const currentPath = window.location.pathname;
    const isAuthPage = currentPath === '/' ||
                      currentPath.startsWith('/auth/') ||
                      currentPath.startsWith('/login') || 
                      currentPath.startsWith('/register') || 
                      currentPath.startsWith('/forgot-password') || 
                      currentPath.startsWith('/reset-password');
    
    if (!isAuthPage) {
      checkSession();
    } else {
      // If on auth page, set loading to false without a user
      dispatch({ type: 'LOGOUT' });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const contextValue: AuthContextType = {
    ...state,
    login,
    logout,
    signup,
    forgotPassword,
    resetPassword,
    updateUser,
    clearError,
    checkSession,
  };

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
};

// Custom hook to use auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};