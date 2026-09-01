import './Loader.css';

export default function Loader({ text = 'Loading...', className = '' }) {
  return (
    <div className={`loader-container ${className}`.trim()}>
      <div className="loader-spinner" role="status" aria-label="loading" />
      {text && <p className="loader-text">{text}</p>}
    </div>
  );
}
