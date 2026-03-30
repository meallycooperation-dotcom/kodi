import { useEffect, useState } from 'react';
import { fetchUnits } from '../services/unitService';
const useUnits = (status = 'vacant', ownerId) => {
    const [units, setUnits] = useState([]);
    useEffect(() => {
        let mounted = true;
        const loadUnits = async () => {
            try {
                const data = await fetchUnits(undefined, status, ownerId);
                if (mounted) {
                    setUnits(data);
                }
            }
            catch (error) {
                console.error('useUnits error', error);
            }
        };
        loadUnits();
        return () => {
            mounted = false;
        };
    }, [status, ownerId]);
    const refresh = async (overrideStatus) => {
        try {
            const data = await fetchUnits(undefined, overrideStatus ?? status, ownerId);
            setUnits(data);
        }
        catch (error) {
            console.error('useUnits refresh error', error);
        }
    };
    return { units, refresh };
};
export default useUnits;
