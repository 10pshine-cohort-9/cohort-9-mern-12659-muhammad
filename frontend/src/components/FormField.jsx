import Input from './Input';
import './FormField.css';

export default function FormField({
  label,
  id,
  error,
  type = 'text',
  value,
  onChange,
  placeholder = '',
  required = false,
  disabled = false,
  children,
  className = '',
  ...rest
}) {
  return (
    <div className={`form-field ${className}`.trim()}>
      {label && (
        <label htmlFor={id} className="form-field__label">
          {label} {required && <span className="form-field__required">*</span>}
        </label>
      )}
      {children || (
        <Input
          id={id}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          hasError={Boolean(error)}
          {...rest}
        />
      )}
      {error && <p className="form-field__error">{error}</p>}
    </div>
  );
}
