import { jsx as _jsx } from "react/jsx-runtime";
const Badge = ({ children, status = 'pending' }) => (_jsx("span", { className: `badge badge--${status}`, children: children }));
export default Badge;
