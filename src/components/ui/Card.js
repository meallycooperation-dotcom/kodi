import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
const Card = ({ title, children, className = '', ...props }) => (_jsxs("section", { className: `card ${className}`, ...props, children: [title && _jsx("header", { className: "card__title", children: title }), _jsx("div", { className: "card__body", children: children })] }));
export default Card;
