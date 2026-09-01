import { useState, useEffect } from 'react';
import { useNotes } from '../hooks/useNotes';
import NoteCard from '../components/NoteCard';
import Button from '../components/Button';
import EmptyState from '../components/EmptyState';
import Loader from '../components/Loader';
import ConfirmDialog from '../components/ConfirmDialog';
import './TrashPage.css';

export default function TrashPage() {
  const { notes, isLoading, error, fetchNotes, restoreNote, permanentDeleteNote } =
    useNotes();

  const [noteToDelete, setNoteToDelete] = useState(null);
  const [statusMessage, setStatusMessage] = useState('');

  useEffect(() => {
    fetchNotes({ isTrash: 'true' });
  }, [fetchNotes]);

  const handleRestore = async (id) => {
    try {
      await restoreNote(id);
      setStatusMessage('Note restored successfully');
      setTimeout(() => setStatusMessage(''), 3000);
    } catch {
      // Error handled in useNotes
    }
  };

  const handlePermanentDelete = async () => {
    if (!noteToDelete) return;
    try {
      await permanentDeleteNote(noteToDelete._id);
      setNoteToDelete(null);
      setStatusMessage('Note deleted permanently');
      setTimeout(() => setStatusMessage(''), 3000);
    } catch {
      // Error handled in useNotes
    }
  };

  return (
    <div className="trash-page">
      <div className="trash-header">
        <div>
          <h1 className="trash-title">Trash</h1>
          <p className="trash-subtitle">
            Notes here are deleted from your active list. You can restore them or delete them permanently.
          </p>
        </div>
      </div>

      {statusMessage && <div className="trash-status-bar">{statusMessage}</div>}
      {error && <div className="trash-error-bar">{error}</div>}

      {isLoading ? (
        <Loader text="Loading trash..." />
      ) : notes.length === 0 ? (
        <EmptyState
          title="Trash is empty"
          message="No trashed notes found."
        />
      ) : (
        <div className="trash-grid">
          {notes.map((note) => (
            <NoteCard
              key={note._id}
              note={note}
              actions={
                <>
                  <Button
                    variant="secondary"
                    onClick={() => handleRestore(note._id)}
                    title="Restore to active notes"
                  >
                    Restore
                  </Button>
                  <Button
                    variant="danger"
                    onClick={() => setNoteToDelete(note)}
                    title="Permanently delete"
                  >
                    Delete forever
                  </Button>
                </>
              }
            />
          ))}
        </div>
      )}

      <ConfirmDialog
        isOpen={Boolean(noteToDelete)}
        title="Delete note permanently?"
        message={`"${noteToDelete?.title || 'Untitled Note'}" will be permanently removed from your account. This action cannot be reversed.`}
        confirmLabel="Delete Forever"
        confirmVariant="danger"
        onConfirm={handlePermanentDelete}
        onCancel={() => setNoteToDelete(null)}
      />
    </div>
  );
}
