import { jsx as _jsx } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import routes from './routes';
import { AppProviders } from './providers';
import { MonthlyRentResetProvider } from './MonthlyRentResetProvider';
import Splash from '../pages/auth/Splash';
const App = () => {
    const [showSplash, setShowSplash] = useState(false);
    const [ready, setReady] = useState(false);
    const navigate = useNavigate();
    useEffect(() => {
        const hasSeenSplash = localStorage.getItem('hasSeenSplash') === 'true';
        setShowSplash(!hasSeenSplash);
        setReady(true);
    }, []);
    useEffect(() => {
        if (ready && !showSplash && window.location.pathname === '/') {
            navigate('/auth/login', { replace: true });
        }
    }, [ready, showSplash, navigate]);
    if (!ready)
        return null;
    if (showSplash) {
        return _jsx(Splash, { onFinish: () => setShowSplash(false) });
    }
    return (_jsx(AppProviders, { children: _jsx(MonthlyRentResetProvider, { children: _jsx(Routes, { children: routes.map((route) => (_jsx(Route, { path: route.path, element: route.element }, route.path))) }) }) }));
};
export default App;
