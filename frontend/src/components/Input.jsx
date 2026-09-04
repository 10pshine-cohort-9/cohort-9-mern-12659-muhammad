import './Input.css';

export default function Input({
  id,
  type = 'text',
  value,
  onChange,
  placeholder = '',
  disabled = false,
  required = false,
  hasError = false,
  className = '',
  ...rest
}) {
  return (
    <input
      id={id}
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      required={required}
      aria-invalid={hasError ? true : undefined}
      className={`input ${hasError ? 'input--error' : ''} ${className}`.trim()}
      {...rest}
    />
  );
}
