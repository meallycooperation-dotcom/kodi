import type { ReactNode } from 'react';
import { CurrencyProvider } from '../context/currency';
import { ThemeProvider } from '../context/theme';

type AppProvidersProps = {
  children: ReactNode;
};

export const AppProviders = ({ children }: AppProvidersProps) => {
  return (
    <ThemeProvider>
      <CurrencyProvider>{children}</CurrencyProvider>
    </ThemeProvider>
  );
};
