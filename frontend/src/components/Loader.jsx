import './Loader.css';

export default function Loader({ text = 'Loading...', className = '' }) {
  return (
    <div
      className={`loader-container ${className}`.trim()}
      role="status"
      aria-label="loading"
    >
      <div className="loader-spinner" aria-hidden="true" />
      {text && <p className="loader-text">{text}</p>}
    </div>
  );
}
