import { jsx as _jsx } from "react/jsx-runtime";
const Button = ({ variant = 'primary', className = '', ...props }) => (_jsx("button", { className: `btn ${variant} ${className}`, ...props }));
export default Button;
