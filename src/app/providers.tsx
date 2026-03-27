import type { ReactNode } from 'react';
import { CurrencyProvider } from '../context/currency';

type AppProvidersProps = {
  children: ReactNode;
};

export const AppProviders = ({ children }: AppProvidersProps) => {
  return <CurrencyProvider>{children}</CurrencyProvider>;
};
