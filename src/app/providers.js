import { jsx as _jsx } from "react/jsx-runtime";
import { CurrencyProvider } from '../context/currency';
export const AppProviders = ({ children }) => {
    return _jsx(CurrencyProvider, { children: children });
};
