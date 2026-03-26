import { useEffect, useState } from 'react';
import { fetchTenants } from '../services/tenantService';
const useTenants = (userId) => {
    const [tenants, setTenants] = useState([]);
    useEffect(() => {
        let mounted = true;
        const loadTenants = async () => {
            const data = await fetchTenants(userId);
            if (mounted)
                setTenants(data);
        };
        loadTenants();
        return () => {
            mounted = false;
        };
    }, [userId]);
    const refresh = async () => {
        const data = await fetchTenants(userId);
        setTenants(data);
    };
    return {
        tenants,
        refresh
    };
};
export default useTenants;
