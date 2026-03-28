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

  if (!ready) return null;

  if (showSplash) {
    return <Splash onFinish={() => setShowSplash(false)} />;
  }

  return (
    <AppProviders>
      <MonthlyRentResetProvider>
        <Routes>
          {routes.map((route) => (
            <Route key={route.path} path={route.path} element={route.element} />
          ))}
        </Routes>
      </MonthlyRentResetProvider>
    </AppProviders>
  );
};

export default App;
