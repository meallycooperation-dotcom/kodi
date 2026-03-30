import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import Button from '../ui/Button';
import Input from '../ui/Input';
const TenantForm = () => (_jsxs("form", { className: "tenant-form space-y-3", children: [_jsx(Input, { label: "Name", name: "name", placeholder: "Jane Tenant" }), _jsx(Input, { label: "Unit", name: "unit", placeholder: "Block B \u00B7 Unit 2" }), _jsx(Button, { type: "submit", children: "Add tenant" })] }));
export default TenantForm;
