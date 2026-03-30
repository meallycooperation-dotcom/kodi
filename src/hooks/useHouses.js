import { useEffect, useState } from 'react';
import { fetchHouses } from '../services/houseService';
const useHouses = (unitId) => {
    const [houses, setHouses] = useState([]);
    useEffect(() => {
        if (!unitId) {
            setHouses([]);
            return;
        }
        let mounted = true;
        const loadHouses = async () => {
            try {
                const fetched = await fetchHouses(unitId);
                if (mounted) {
                    setHouses(fetched);
                }
            }
            catch (error) {
                console.error('useHouses error', error);
                if (mounted)
                    setHouses([]);
            }
        };
        loadHouses();
        return () => {
            mounted = false;
        };
    }, [unitId]);
    const refresh = async () => {
        if (!unitId) {
            setHouses([]);
            return;
        }
        try {
            const fetched = await fetchHouses(unitId);
            setHouses(fetched);
        }
        catch (error) {
            console.error('useHouses refresh error', error);
            setHouses([]);
        }
    };
    return { houses, refresh };
};
export default useHouses;
