import { useEffect, useState } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import routes from './routes';
import { AppProviders } from './providers';
import { MonthlyRentResetProvider } from './MonthlyRentResetProvider';
import LandingPage from '../pages/landing/LandingPage';

const App = () => {
  const [showLanding, setShowLanding] = useState(false);
  const [ready, setReady] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const hasSeenLanding = localStorage.getItem('hasSeenLanding') === 'true';
    setShowLanding(!hasSeenLanding);
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready && !showLanding && window.location.pathname === '/') {
      navigate('/auth/login', { replace: true });
    }
  }, [ready, showLanding, navigate]);

  if (!ready) return null;

  if (showLanding) {
    return (
      <LandingPage
        onSeen={() => {
          localStorage.setItem('hasSeenLanding', 'true');
          setShowLanding(false);
        }}
      />
    );
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
