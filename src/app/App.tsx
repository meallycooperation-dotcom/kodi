import { Routes, Route } from 'react-router-dom';
import routes from './routes';
import { AppProviders } from './providers';

const App = () => (
  <AppProviders>
    <Routes>
      {routes.map((route) => (
        <Route key={route.path} path={route.path} element={route.element} />
      ))}
    </Routes>
  </AppProviders>
);

export default App;
