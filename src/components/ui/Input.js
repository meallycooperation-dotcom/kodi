import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
const Input = ({ label, className = '', ...props }) => (_jsxs("label", { className: `input-field ${className}`, children: [_jsx("span", { children: label }), _jsx("input", { ...props })] }));
export default Input;
