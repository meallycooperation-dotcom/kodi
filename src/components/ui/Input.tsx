import type { InputHTMLAttributes } from 'react';

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
};

const Input = ({ label, className = '', ...props }: InputProps) => (
  <label className={`input-field ${className}`}>
    <span>{label}</span>
    <input {...props} />
  </label>
);

export default Input;

