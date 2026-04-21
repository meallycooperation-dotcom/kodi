import { useEffect, useState } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import routes from './routes';
import { AppProviders } from './providers';
import { MonthlyRentResetProvider } from './MonthlyRentResetProvider';
import LandingPage from '../pages/landing/LandingPage';
import { clientStorage } from '../lib/clientStorage';

const App = () => {
  const [showLanding, setShowLanding] = useState(false);
  const [ready, setReady] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    let active = true;

    const loadLandingState = async () => {
      const hasSeenLanding = await clientStorage.getBoolean('hasSeenLanding', false);

      if (!active) {
        return;
      }

      setShowLanding(!hasSeenLanding);
      setReady(true);
    };

    void loadLandingState();

    return () => {
      active = false;
    };
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
          setShowLanding(false);
          void clientStorage.setBoolean('hasSeenLanding', true);
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
