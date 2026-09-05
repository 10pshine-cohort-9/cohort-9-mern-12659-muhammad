import { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useNotes } from '../hooks/useNotes';
import NoteCard from '../components/NoteCard';
import Button from '../components/Button';
import CategoryBadge from '../components/CategoryBadge';
import EmptyState from '../components/EmptyState';
import Loader from '../components/Loader';
import Input from '../components/Input';
import ConfirmDialog from '../components/ConfirmDialog';
import { importNotes } from '../api/notesApi';
import './DashboardPage.css';

export default function DashboardPage() {
  const navigate = useNavigate();
  const { notes, isLoading, error, fetchNotes, trashNote } = useNotes();

  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [noteToTrash, setNoteToTrash] = useState(null);
  const [isImporting, setIsImporting] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  // Derive unique categories from active notes list client-side
  const categories = useMemo(() => {
    const set = new Set();
    notes.forEach((note) => {
      if (note.category && note.category.trim()) {
        set.add(note.category.trim());
      }
    });
    return Array.from(set).sort();
  }, [notes]);

  // Filter notes by search query and category
  const filteredNotes = useMemo(() => {
    return notes.filter((note) => {
      const matchesCategory =
        selectedCategory === 'ALL' || note.category?.trim() === selectedCategory;

      const titleMatch = (note.title || '')
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      const contentMatch = (note.content || '')
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      const matchesSearch = !searchQuery || titleMatch || contentMatch;

      return matchesCategory && matchesSearch;
    });
  }, [notes, selectedCategory, searchQuery]);

  const handleNoteClick = (noteId) => {
    navigate(`/notes/${noteId}`);
  };

  const handleConfirmTrash = async () => {
    if (!noteToTrash) return;
    try {
      await trashNote(noteToTrash._id);
      setNoteToTrash(null);
      setStatusMessage('Note moved to trash');
      setTimeout(() => setStatusMessage(''), 3000);
    } catch {
      // Error is set in useNotes hook
    }
  };

  const handleImportFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setStatusMessage('');

    try {
      const text = await file.text();
      let parsed = [];

      if (file.name.endsWith('.json')) {
        const json = JSON.parse(text);
        parsed = Array.isArray(json) ? json : json.notes || [];
      } else {
        // Fallback for text / html import
        parsed = [{ title: file.name.replace(/\.[^/.]+$/, ''), content: text }];
      }

      await importNotes(parsed);
      await fetchNotes();
      setStatusMessage('Notes imported successfully');
      setTimeout(() => setStatusMessage(''), 3000);
    } catch {
      setStatusMessage('Failed to import notes. Please check the file format.');
    } finally {
      setIsImporting(false);
      e.target.value = '';
    }
  };

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">My Notes</h1>
          <p className="dashboard-subtitle">
            {notes.length} {notes.length === 1 ? 'note' : 'notes'} saved
          </p>
        </div>

        <div className="dashboard-actions">
          <label className="btn btn--secondary import-label">
            {isImporting ? 'Importing...' : 'Import'}
            <input
              type="file"
              accept=".json,.html,.txt"
              onChange={handleImportFile}
              className="visually-hidden"
              disabled={isImporting}
              aria-label="Import notes"
            />
          </label>
          <Button variant="primary" onClick={() => navigate('/notes/new')}>
            + New Note
          </Button>
        </div>
      </div>

      {statusMessage && <div className="dashboard-status-bar">{statusMessage}</div>}
      {error && <div className="dashboard-error-bar">{error}</div>}

      <div className="dashboard-toolbar">
        <div className="search-box">
          <Input
            type="search"
            placeholder="Search notes by title or content..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {categories.length > 0 && (
          <div className="category-filter-row" role="group" aria-label="Filter by category">
            <CategoryBadge
              label="All"
              isActive={selectedCategory === 'ALL'}
              onClick={() => setSelectedCategory('ALL')}
            />
            {categories.map((cat) => (
              <CategoryBadge
                key={cat}
                label={cat}
                isActive={selectedCategory === cat}
                onClick={() => setSelectedCategory(cat)}
              />
            ))}
          </div>
        )}
      </div>

      {isLoading ? (
        <Loader text="Loading your notes..." />
      ) : filteredNotes.length === 0 ? (
        <EmptyState
          title={searchQuery || selectedCategory !== 'ALL' ? 'No matching notes' : 'No notes yet'}
          message={
            searchQuery || selectedCategory !== 'ALL'
              ? 'Try changing your search keywords or category filter.'
              : 'Create your first note to start organizing your thoughts.'
          }
          action={
            !searchQuery && selectedCategory === 'ALL' ? (
              <Button variant="primary" onClick={() => navigate('/notes/new')}>
                Create Note
              </Button>
            ) : null
          }
        />
      ) : (
        <div className="notes-grid">
          {filteredNotes.map((note) => (
            <NoteCard
              key={note._id}
              note={note}
              onClick={() => handleNoteClick(note._id)}
              actions={
                <Button
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation();
                    setNoteToTrash(note);
                  }}
                  title="Move to trash"
                  aria-label={`Trash ${note.title || 'untitled'}`}
                >
                  Trash
                </Button>
              }
            />
          ))}
        </div>
      )}

      <ConfirmDialog
        isOpen={Boolean(noteToTrash)}
        title="Move to trash?"
        message={`"${noteToTrash?.title || 'Untitled Note'}" will be moved to the trash. You can restore it anytime.`}
        confirmLabel="Move to Trash"
        confirmVariant="danger"
        onConfirm={handleConfirmTrash}
        onCancel={() => setNoteToTrash(null)}
      />
    </div>
  );
}
