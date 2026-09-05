import apiClient from './axios';

export const getNotes = async (params = {}) => {
  const response = await apiClient.get('/api/notes', { params });
  return response.data;
};

export const getNoteById = async (id) => {
  const response = await apiClient.get(`/api/notes/${id}`);
  return response.data;
};

export const createNote = async (noteData) => {
  const response = await apiClient.post('/api/notes', noteData);
  return response.data;
};

export const updateNote = async (id, noteData) => {
  const response = await apiClient.put(`/api/notes/${id}`, noteData);
  return response.data;
};

export const trashNote = async (id) => {
  const response = await apiClient.delete(`/api/notes/${id}`);
  return response.data;
};

export const restoreNote = async (id) => {
  const response = await apiClient.patch(`/api/notes/${id}/restore`);
  return response.data;
};

export const permanentDeleteNote = async (id) => {
  const response = await apiClient.delete(`/api/notes/${id}/permanent`);
  return response.data;
};

export const importNotes = async (notesArray) => {
  const response = await apiClient.post('/api/notes/import', notesArray);
  return response.data;
};
