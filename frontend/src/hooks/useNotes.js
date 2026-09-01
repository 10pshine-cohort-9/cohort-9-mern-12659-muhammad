import { useState, useCallback } from 'react';
import {
  getNotes,
  createNote as apiCreateNote,
  updateNote as apiUpdateNote,
  trashNote as apiTrashNote,
  restoreNote as apiRestoreNote,
  permanentDeleteNote as apiPermanentDeleteNote,
} from '../api/notesApi';

export function useNotes() {
  const [notes, setNotes] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchNotes = useCallback(async (params = {}) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await getNotes(params);
      setNotes(response.data || []);
      return response.data || [];
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to fetch notes';
      setError(errorMessage);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createNote = async (noteData) => {
    setError(null);
    try {
      const response = await apiCreateNote(noteData);
      if (response?.data) {
        setNotes((prev) => [response.data, ...prev]);
      }
      return response.data;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to create note';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const updateNote = async (id, noteData) => {
    setError(null);
    try {
      const response = await apiUpdateNote(id, noteData);
      if (response?.data) {
        setNotes((prev) =>
          prev.map((item) => (item._id === id ? response.data : item))
        );
      }
      return response.data;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to update note';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const trashNote = async (id) => {
    setError(null);
    try {
      await apiTrashNote(id);
      setNotes((prev) => prev.filter((item) => item._id !== id));
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to move note to trash';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const restoreNote = async (id) => {
    setError(null);
    try {
      await apiRestoreNote(id);
      setNotes((prev) => prev.filter((item) => item._id !== id));
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to restore note';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const permanentDeleteNote = async (id) => {
    setError(null);
    try {
      await apiPermanentDeleteNote(id);
      setNotes((prev) => prev.filter((item) => item._id !== id));
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to delete note permanently';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  return {
    notes,
    isLoading,
    error,
    fetchNotes,
    createNote,
    updateNote,
    trashNote,
    restoreNote,
    permanentDeleteNote,
  };
}
