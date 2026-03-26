import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
const Table = ({ headers, children }) => (_jsxs("table", { className: "table", children: [_jsx("thead", { children: _jsx("tr", { children: headers.map((cell) => (_jsx("th", { children: cell }, cell))) }) }), _jsx("tbody", { children: children })] }));
export default Table;
