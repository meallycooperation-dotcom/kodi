import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import Table from '../ui/Table';
const TenantTable = ({ tenants }) => (_jsx(Table, { headers: ['Name', 'Unit', 'Status', 'Move-in', 'Phone'], children: tenants.map((tenant) => (_jsxs("tr", { children: [_jsx("td", { children: tenant.fullName }), _jsx("td", { children: tenant.unitId ?? '—' }), _jsx("td", { children: tenant.status }), _jsx("td", { children: tenant.moveInDate ?? '—' }), _jsx("td", { children: tenant.phone ?? '—' })] }, tenant.id))) }));
export default TenantTable;
