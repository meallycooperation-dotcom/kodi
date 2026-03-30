import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import Table from '../ui/Table';
const TenantTable = ({ tenants, units = [] }) => {
    const unitMap = new Map(units.map((unit) => [unit.id, unit.unitNumber]));
    return (_jsx(Table, { headers: ['Name', 'Unit', 'House', 'Status', 'Move-in', 'Phone'], children: tenants.map((tenant) => (_jsxs("tr", { children: [_jsx("td", { children: tenant.fullName }), _jsx("td", { children: tenant.unitId ? unitMap.get(tenant.unitId) ?? tenant.unitId : '—' }), _jsx("td", { children: tenant.houseNumber ?? '—' }), _jsx("td", { children: tenant.status }), _jsx("td", { children: tenant.moveInDate ?? '—' }), _jsx("td", { children: tenant.phone ?? '—' })] }, tenant.id))) }));
};
export default TenantTable;
