import './CategoryBadge.css';

export default function CategoryBadge({
  label,
  isActive = false,
  onClick,
  className = '',
}) {
  if (!label) return null;

  if (onClick) {
    return (
      <button
        type="button"
        className={`category-badge category-badge--clickable ${isActive ? 'category-badge--active' : ''} ${className}`.trim()}
        onClick={onClick}
      >
        {label}
      </button>
    );
  }

  return (
    <span className={`category-badge ${className}`.trim()}>
      {label}
    </span>
  );
}
