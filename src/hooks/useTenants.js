import { useEffect, useState } from 'react';
import { fetchTenants } from '../services/tenantService';
import useAuth from './useAuth';
const useTenants = () => {
    const { user } = useAuth();
    const [tenants, setTenants] = useState([]);
    useEffect(() => {
        let mounted = true;
        const loadTenants = async () => {
            const data = await fetchTenants(user?.id);
            if (mounted)
                setTenants(data);
        };
        loadTenants();
        return () => {
            mounted = false;
        };
    }, [user?.id]);
    const refresh = async () => {
        const data = await fetchTenants(user?.id);
        setTenants(data);
    };
    return {
        tenants,
        refresh
    };
};
export default useTenants;
