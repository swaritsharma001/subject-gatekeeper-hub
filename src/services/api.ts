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

// Fetch all subjects
export const fetchSubjects = async (): Promise<ApiSubject[]> => {
  const response = await fetch(`${API_BASE_URL}/subjects`);
  if (!response.ok) {
    throw new Error('Failed to fetch subjects');
  }
  return response.json();
};

// Fetch lectures by subject ID
export const fetchLecturesBySubject = async (subjectId: string): Promise<ApiLecture[]> => {
  const response = await fetch(`${API_BASE_URL}/lectures/${subjectId}`);
  if (!response.ok) {
    throw new Error('Failed to fetch lectures');
  }
  return response.json();
};

// Add a new subject
export const addSubject = async (data: { subject: string; id: string }): Promise<ApiSubject> => {
  const response = await fetch(`${API_BASE_URL}/subject/add`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error('Failed to add subject');
  }
  return response.json();
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
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error('Failed to add lecture');
  }
  return response.json();
};
