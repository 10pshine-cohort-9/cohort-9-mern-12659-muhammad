import CategoryBadge from './CategoryBadge';
import './NoteCard.css';

// Helper to strip HTML tags for plain-text snippet preview
function getSnippet(htmlContent, maxLength = 120) {
  if (!htmlContent) return 'Empty note';
  const text = htmlContent.replace(/<[^>]*>?/gm, ' ').replace(/\s+/g, ' ').trim();
  if (!text) return 'Empty note';
  return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;
}

// Helper to format ISO date string
function formatDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function NoteCard({ note, onClick, actions, className = '' }) {
  const { title, content, category, updatedAt, createdAt } = note || {};
  const displayTitle = title?.trim() || 'Untitled Note';
  const snippet = getSnippet(content);
  const displayDate = formatDate(updatedAt || createdAt);

  return (
    <article
      className={`note-card ${onClick ? 'note-card--clickable' : ''} ${className}`.trim()}
      onClick={onClick}
    >
      <div className="note-card__header">
        <h3 className="note-card__title">{displayTitle}</h3>
        {category && <CategoryBadge label={category} />}
      </div>

      <p className="note-card__snippet">{snippet}</p>

      <div className="note-card__footer">
        <span className="note-card__date">{displayDate}</span>
        {actions && (
          <div
            className="note-card__actions"
            onClick={(e) => e.stopPropagation()}
          >
            {actions}
          </div>
        )}
      </div>
    </article>
  );
}
