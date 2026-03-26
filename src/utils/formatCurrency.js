const currencyFormatter = new Intl.NumberFormat('en-KE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
});
export const formatCurrency = (value) => `Ksh. ${currencyFormatter.format(value ?? 0)}`;
