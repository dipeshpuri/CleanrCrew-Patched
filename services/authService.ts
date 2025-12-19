import { User } from '../types';

const STORAGE_KEY_USERS = 'cleanr_users';
const STORAGE_KEY_SESSION = 'cleanr_session';

// Helper to get all users
const getUsers = (): User[] => {
  const usersStr = localStorage.getItem(STORAGE_KEY_USERS);
  return usersStr ? JSON.parse(usersStr) : [];
};

// Register a new user
export const registerUser = (userData: Omit<User, 'id'>): { success: boolean; message?: string; user?: User } => {
  const users = getUsers();
  
  // Check if email exists
  if (users.find(u => u.email.toLowerCase() === userData.email.toLowerCase())) {
    return { success: false, message: 'Email already registered' };
  }

  const newUser: User = {
    id: Date.now().toString(),
    ...userData
  };

  users.push(newUser);
  localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(users));
  
  // Auto login
  localStorage.setItem(STORAGE_KEY_SESSION, JSON.stringify(newUser));
  
  return { success: true, user: newUser };
};

// Login user
export const loginUser = (email: string, password: string): { success: boolean; message?: string; user?: User } => {
  const users = getUsers();
  const user = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);

  if (user) {
    localStorage.setItem(STORAGE_KEY_SESSION, JSON.stringify(user));
    return { success: true, user };
  }

  return { success: false, message: 'Invalid email or password' };
};

// Get current session
export const getCurrentSession = (): User | null => {
  const sessionStr = localStorage.getItem(STORAGE_KEY_SESSION);
  return sessionStr ? JSON.parse(sessionStr) : null;
};

// Logout
export const logoutUser = () => {
  localStorage.removeItem(STORAGE_KEY_SESSION);
};