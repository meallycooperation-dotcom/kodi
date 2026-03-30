import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
const Modal = ({ title, children }) => (_jsx("div", { className: "modal-veil", children: _jsxs("div", { className: "modal-content", children: [_jsx("header", { className: "modal-content__header", children: _jsx("h2", { children: title }) }), _jsx("div", { className: "modal-content__body", children: children })] }) }));
export default Modal;
