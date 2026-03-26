import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import TenantCard from '../../components/tenants/TenantCard';
import useAuth from '../../hooks/useAuth';
import useTenants from '../../hooks/useTenants';
const TenantDetails = () => {
    const { user } = useAuth();
    const { tenants } = useTenants(user?.id);
    const tenant = tenants[0];
    return (_jsxs("section", { className: "space-y-4", children: [_jsx("h1", { children: "Tenant Details" }), tenant ? (_jsx(TenantCard, { tenant: tenant })) : (_jsx("p", { children: "No tenant selected." }))] }));
};
export default TenantDetails;
