import { apiRequest } from './api';

export function registerUser(name, email, password) {
  return apiRequest('/users', {
    method: 'POST',
    body: { name, email, password }
  });
}

export function loginUser(email, password) {
  return apiRequest('/users/login', {
    method: 'POST',
    body: { email, password }
  });
}

export function getCurrentUser(token) {
  return apiRequest('/users/me', { token });
}

export function logoutUser(token) {
  return apiRequest('/users/logout', { method: 'POST', token });
}
