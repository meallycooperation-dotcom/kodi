import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import Sidebar from './Sidebar';
const DashboardLayout = ({ children }) => (_jsxs("div", { className: "layout-grid", children: [_jsx(Sidebar, {}), _jsx("div", { className: "layout-main", children: _jsx("main", { children: children }) })] }));
export default DashboardLayout;
