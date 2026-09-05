import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getNoteById, createNote, updateNote } from '../api/notesApi';
import RichTextEditor from '../components/RichTextEditor';
import Input from '../components/Input';
import Button from '../components/Button';
import Loader from '../components/Loader';
import ConfirmDialog from '../components/ConfirmDialog';
import './NoteEditorPage.css';

export default function NoteEditorPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('');
  const [isLoading, setIsLoading] = useState(isEditing);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showDiscardModal, setShowDiscardModal] = useState(false);

  // Keep track of initial loaded state to detect unsaved changes
  const initialDataRef = useRef({ title: '', content: '', category: '' });

  useEffect(() => {
    if (!isEditing) {
      setIsLoading(false);
      return;
    }

    let isMounted = true;

    const fetchNote = async () => {
      try {
        const response = await getNoteById(id);
        if (isMounted && response?.data) {
          const note = response.data;
          setTitle(note.title || '');
          setContent(note.content || '');
          setCategory(note.category || '');
          initialDataRef.current = {
            title: note.title || '',
            content: note.content || '',
            category: note.category || '',
          };
        }
      } catch (err) {
        if (isMounted) {
          setErrorMessage(err.response?.data?.message || 'Failed to load note');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchNote();

    return () => {
      isMounted = false;
    };
  }, [id, isEditing]);

  const hasUnsavedChanges = () => {
    return (
      title !== initialDataRef.current.title ||
      content !== initialDataRef.current.content ||
      category !== initialDataRef.current.category
    );
  };

  const handleSave = async () => {
    // Backend requires content to be non-empty string
    const trimmedContent = content.trim();
    if (
      !trimmedContent ||
      trimmedContent === '<p></p>' ||
      trimmedContent === '<p><br></p>'
    ) {
      setErrorMessage('Note content cannot be empty');
      return;
    }

    setIsSaving(true);
    setErrorMessage('');

    const payload = {
      title: title.trim(),
      content: trimmedContent,
      category: category.trim() || null,
    };

    try {
      if (isEditing) {
        await updateNote(id, payload);
      } else {
        await createNote(payload);
      }
      navigate('/dashboard');
    } catch (err) {
      setErrorMessage(
        err.response?.data?.message || 'Failed to save note. Please try again.'
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (hasUnsavedChanges()) {
      setShowDiscardModal(true);
    } else {
      navigate('/dashboard');
    }
  };

  const handleExport = () => {
    const filename = `${title.trim() || 'untitled-note'}.html`;
    const escapeHtml = (str) =>
      str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');

    const escapedTitle = escapeHtml(title || 'Untitled Note');
    const escapedCategory = category ? escapeHtml(category) : '';

    const fullHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${escapedTitle}</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 720px; margin: 40px auto; padding: 0 16px; color: #1F2421; line-height: 1.6; }
    h1 { color: #C1622D; }
    .category { display: inline-block; padding: 2px 8px; border-radius: 12px; background: #FAF9F6; border: 1px solid #E5E2DA; font-size: 12px; color: #6B6F6D; }
  </style>
</head>
<body>
  <h1>${escapedTitle}</h1>
  ${escapedCategory ? `<p><span class="category">${escapedCategory}</span></p>` : ''}
  <hr style="border: none; border-top: 1px solid #E5E2DA; margin: 20px 0;" />
  ${content}
</body>
</html>`;

    const blob = new Blob([fullHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return <Loader text="Loading note..." />;
  }

  return (
    <div className="note-editor-page">
      <div className="editor-top-bar">
        <h1 className="editor-page-title">
          {isEditing ? 'Edit Note' : 'New Note'}
        </h1>

        <div className="editor-top-actions">
          {isEditing && (
            <Button variant="secondary" onClick={handleExport} title="Export as HTML">
              Export HTML
            </Button>
          )}
          <Button variant="secondary" onClick={handleCancel}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save Note'}
          </Button>
        </div>
      </div>

      {errorMessage && <div className="editor-error-banner">{errorMessage}</div>}

      <div className="editor-form">
        <div className="editor-meta-row">
          <div className="editor-meta-title">
            <label htmlFor="note-title" className="editor-label">
              Title
            </label>
            <Input
              id="note-title"
              placeholder="Note title (e.g. Weekly Reflections)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="editor-meta-category">
            <label htmlFor="note-category" className="editor-label">
              Category
            </label>
            <Input
              id="note-category"
              placeholder="Category (e.g. Work, Ideas)"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            />
          </div>
        </div>

        <div className="editor-content-section">
          <label className="editor-label">Content *</label>
          <RichTextEditor
            initialContent={content}
            onChange={(html) => setContent(html)}
            placeholder="Write your note here using bold, italics, headings, or lists..."
          />
        </div>
      </div>

      <ConfirmDialog
        isOpen={showDiscardModal}
        title="Discard unsaved changes?"
        message="You have unsaved changes that will be lost if you leave now."
        confirmLabel="Discard Changes"
        confirmVariant="danger"
        onConfirm={() => navigate('/dashboard')}
        onCancel={() => setShowDiscardModal(false)}
      />
    </div>
  );
}
