import React from "react";
import cn from "classnames";
import styles from "./input.module.css";

export const Input = ({
  type = "text",
  placeholder,
  value,
  onChange,
  onBlur,
  name,
  label,
  error,
  disabled = false,
  required = false,
  className,
}) => {
  return (
    <div className={cn(styles.wrapper, className)}>
      {label && (
        <label className={styles.label}>
          {label}
          {required && <span className={styles.required}>*</span>}
        </label>
      )}
      <input
        type={type}
        name={name}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        disabled={disabled}
        className={cn(styles.input, error && styles.error)}
      />
      {error && <span className={styles.errorText}>{error}</span>}
    </div>
  );
};
