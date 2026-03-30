import { Fragment as _Fragment, jsx as _jsx } from "react/jsx-runtime";
import useMonthlyRentReset from '../hooks/useMonthlyRentReset';
export const MonthlyRentResetProvider = ({ children }) => {
    // This hook runs automatically on mount and checks/creates monthly rent entries
    useMonthlyRentReset();
    return _jsx(_Fragment, { children: children });
};
