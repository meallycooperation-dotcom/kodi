import type { ButtonHTMLAttributes } from 'react';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'ghost';
};

const Button = ({ variant = 'primary', className = '', ...props }: ButtonProps) => (
  <button className={`btn ${variant} ${className}`} {...props} />
);

export default Button;

