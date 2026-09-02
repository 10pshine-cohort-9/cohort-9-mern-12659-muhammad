import { useId, cloneElement, isValidElement } from 'react';
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
  const autoId = useId();
  const inputId = id || autoId;
  const errorId = `${inputId}-error`;
  const hasError = Boolean(error);

  const renderChildren = () => {
    if (typeof children === 'function') {
      return children({
        id: inputId,
        errorId,
        hasError,
        'aria-invalid': hasError ? true : undefined,
        'aria-describedby': hasError ? errorId : undefined,
      });
    }

    if (isValidElement(children)) {
      return cloneElement(children, {
        id: children.props.id || inputId,
        hasError: children.props.hasError !== undefined ? children.props.hasError : hasError,
        'aria-invalid': hasError ? true : children.props['aria-invalid'],
        'aria-describedby': hasError
          ? children.props['aria-describedby']
            ? `${children.props['aria-describedby']} ${errorId}`
            : errorId
          : children.props['aria-describedby'],
      });
    }

    if (children) {
      return children;
    }

    return (
      <Input
        id={inputId}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        hasError={hasError}
        aria-invalid={hasError ? true : undefined}
        aria-describedby={hasError ? errorId : undefined}
        {...rest}
      />
    );
  };

  return (
    <div className={`form-field ${className}`.trim()}>
      {label && (
        <label htmlFor={inputId} className="form-field__label">
          {label} {required && <span className="form-field__required">*</span>}
        </label>
      )}
      {renderChildren()}
      {error && (
        <p id={errorId} className="form-field__error">
          {error}
        </p>
      )}
    </div>
  );
}
