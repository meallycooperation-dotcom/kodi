import { Routes, Route } from 'react-router-dom';
import routes from './routes';
import { AppProviders } from './providers';
import { MonthlyRentResetProvider } from './MonthlyRentResetProvider';

const App = () => (
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

export default App;
