import useMonthlyRentReset from '../hooks/useMonthlyRentReset';

type MonthlyRentResetProviderProps = {
  children: React.ReactNode;
};

export const MonthlyRentResetProvider = ({ children }: MonthlyRentResetProviderProps) => {
  // This hook runs automatically on mount and checks/creates monthly rent entries
  useMonthlyRentReset();

  return <>{children}</>;
};
