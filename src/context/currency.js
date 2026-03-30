import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
const STORAGE_KEY = 'kodi_selected_currency';
const DEFAULT_CURRENCY = 'KES';
const BASE_CURRENCY = 'KES';
const API_BASE = 'USD';
const API_KEY = import.meta.env.VITE_FREECURRENCY_API_KEY;
const API_URL = API_KEY ? `https://api.freecurrencyapi.com/v1/latest?apikey=${API_KEY}` : undefined;
const CurrencyContext = createContext(undefined);
const normalizeCurrency = (value) => (value ? value.trim().toUpperCase() : DEFAULT_CURRENCY);
export const CurrencyProvider = ({ children }) => {
    const [rates, setRates] = useState({ [BASE_CURRENCY]: 1, [API_BASE]: 1 });
    const [loading, setLoading] = useState(true);
    const [selectedCurrency, setSelectedCurrency] = useState(() => {
        if (typeof window === 'undefined') {
            return DEFAULT_CURRENCY;
        }
        return normalizeCurrency(window.localStorage.getItem(STORAGE_KEY) ?? DEFAULT_CURRENCY);
    });
    useEffect(() => {
        if (typeof window === 'undefined') {
            return;
        }
        window.localStorage.setItem(STORAGE_KEY, selectedCurrency);
    }, [selectedCurrency]);
    useEffect(() => {
        if (!API_URL) {
            setLoading(false);
            return;
        }
        const controller = new AbortController();
        const fetchRates = async () => {
            try {
                const response = await fetch(API_URL, { signal: controller.signal });
                if (!response.ok) {
                    throw new Error(`Failed to load currency rates (${response.status})`);
                }
                const payload = await response.json();
                const currencyData = payload?.data;
                const payloadBase = typeof payload?.base === 'string' ? payload.base : API_BASE;
                if (currencyData && typeof currencyData === 'object') {
                    const normalizedRates = Object.entries(currencyData).reduce((acc, [key, value]) => {
                        if (typeof value === 'number') {
                            acc[key.toUpperCase()] = value;
                        }
                        return acc;
                    }, {});
                    const baseCurrency = payloadBase.toUpperCase();
                    normalizedRates[baseCurrency] = 1;
                    setRates((prev) => {
                        const merged = {
                            ...prev,
                            ...normalizedRates
                        };
                        merged[BASE_CURRENCY] = merged[BASE_CURRENCY] ?? prev[BASE_CURRENCY] ?? 1;
                        return merged;
                    });
                }
            }
            catch (error) {
                if (error.name !== 'AbortError') {
                    console.error('fetchCurrencyRates', error);
                }
            }
            finally {
                setLoading(false);
            }
        };
        fetchRates();
        return () => controller.abort();
    }, []);
    const convertToSelected = useCallback((value) => {
        const amount = typeof value === 'number' ? value : 0;
        // 1. Get the rates from your state
        const kshRate = rates[BASE_CURRENCY]; // e.g., 130
        const targetRate = rates[selectedCurrency]; // e.g., 0.75 for GBP
        // 2. Safety check: If rates aren't loaded yet, return original amount
        if (!kshRate || !targetRate) {
            return amount;
        }
        // 3. The Bridge Math: (Input KES / KES per USD) * Target per USD
        return (amount / kshRate) * targetRate;
    }, [rates, selectedCurrency]);
    const formatter = useMemo(() => {
        try {
            return new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: selectedCurrency,
                minimumFractionDigits: 2
            });
        }
        catch {
            return new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: DEFAULT_CURRENCY
            });
        }
    }, [selectedCurrency]);
    const formatCurrency = useCallback((value) => {
        const amount = convertToSelected(value ?? 0);
        return formatter.format(amount);
    }, [convertToSelected, formatter]);
    const availableCurrencies = useMemo(() => {
        const codes = new Set([BASE_CURRENCY, selectedCurrency, API_BASE]);
        Object.keys(rates).forEach((code) => {
            if (code) {
                codes.add(code.toUpperCase());
            }
        });
        return Array.from(codes).sort();
    }, [rates, selectedCurrency]);
    const handleCurrencyUpdate = useCallback((currency) => {
        setSelectedCurrency(normalizeCurrency(currency) || DEFAULT_CURRENCY);
    }, []);
    const value = useMemo(() => ({
        selectedCurrency,
        setSelectedCurrency: handleCurrencyUpdate,
        formatCurrency,
        availableCurrencies,
        rates,
        loading
    }), [selectedCurrency, handleCurrencyUpdate, formatCurrency, availableCurrencies, rates, loading]);
    return _jsx(CurrencyContext.Provider, { value: value, children: children });
};
export const useCurrency = () => {
    const context = useContext(CurrencyContext);
    if (!context) {
        throw new Error('useCurrency must be used within a CurrencyProvider');
    }
    return context;
};
