// API Service to connect to your backend
const API_BASE_URL = 'https://f9a4744f-c12b-4e45-829f-6b93e3816213-00-2kvez0r79qcb8.kirk.replit.dev';

export interface ApiSubject {
  _id: string;
  subject: string;
  id: string;
  totalVideos: number;
}

export interface ApiLecture {
  _id: string;
  title: string;
  duration: string;
  subjectId: string;
  link: string;
}

export interface AuthResponse {
  token: string;
  expiresAt: string;
}

export interface AuthKey {
  _id: string;
  authKey: string;
  type: 'trial' | 'permanent';
  used: boolean;
  name?: string;
  token?: string;
  expiresAt?: string;
  createdAt?: string;
}

// Clear all auth cookies
export const clearAuthCookies = () => {
  document.cookie = 'auth_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
  document.cookie = 'auth_expiry=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
  // Force page reload to show auth modal
  window.location.reload();
};

// Get auth token from cookie
const getAuthToken = (): string | null => {
  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [cookieName, cookieValue] = cookie.trim().split('=');
    if (cookieName === 'auth_token') {
      return cookieValue;
    }
  }
  return null;
};

// Create headers with auth token
const getAuthHeaders = (): HeadersInit => {
  const token = getAuthToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: token } : {}),
  };
};

// Handle API errors - clear cookies on auth errors
const handleApiError = (response: Response, errorMessage: string) => {
  if (response.status === 401 || response.status === 403) {
    // Auth error - clear cookies and reload
    clearAuthCookies();
  }
  throw new Error(errorMessage);
};

// Use auth key to get token
export const useAuthKey = async (authKey: string): Promise<AuthResponse> => {
  const response = await fetch(`${API_BASE_URL}/key/use`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ authKey }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to authenticate');
  }
  return response.json();
};

// ============ KEY MANAGEMENT APIs ============

// Fetch all keys
export const fetchKeys = async (): Promise<AuthKey[]> => {
  const response = await fetch(`${API_BASE_URL}/keys`);
  if (!response.ok) {
    throw new Error('Failed to fetch keys');
  }
  return response.json();
};

// Create a new key
export const createKey = async (data: { type: 'trial' | 'permanent'; name?: string }): Promise<AuthKey> => {
  const response = await fetch(`${API_BASE_URL}/key/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error('Failed to create key');
  }
  return response.json();
};

// Delete a key
export const deleteKey = async (id: string): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/key/delete/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new Error('Failed to delete key');
  }
};

// ============ SUBJECT APIs ============

// Fetch all subjects
export const fetchSubjects = async (): Promise<ApiSubject[]> => {
  const response = await fetch(`${API_BASE_URL}/subjects`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) {
    handleApiError(response, 'Failed to fetch subjects');
  }
  return response.json();
};

// Fetch lectures by subject ID
export const fetchLecturesBySubject = async (subjectId: string): Promise<ApiLecture[]> => {
  const response = await fetch(`${API_BASE_URL}/lectures/${subjectId}`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) {
    handleApiError(response, 'Failed to fetch lectures');
  }
  return response.json();
};

// Add a new subject
export const addSubject = async (data: { subject: string; id: string }): Promise<ApiSubject> => {
  const response = await fetch(`${API_BASE_URL}/subject/add`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    handleApiError(response, 'Failed to add subject');
  }
  return response.json();
};

// Delete a subject
export const deleteSubject = async (id: string): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/subject/delete/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  if (!response.ok) {
    handleApiError(response, 'Failed to delete subject');
  }
};

// Add a new lecture
export const addLecture = async (data: {
  title: string;
  duration: string;
  subjectId: string;
  link: string;
}): Promise<ApiLecture> => {
  const response = await fetch(`${API_BASE_URL}/lecture/add`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    handleApiError(response, 'Failed to add lecture');
  }
  return response.json();
};

// Delete a lecture
export const deleteLecture = async (id: string): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/lecture/delete/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  if (!response.ok) {
    handleApiError(response, 'Failed to delete lecture');
  }
};
