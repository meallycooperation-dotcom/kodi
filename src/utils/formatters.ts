const DECIMAL_AMOUNT_FORMATTER = new Intl.NumberFormat('en-KE', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});

export const formatAmount = (value: number) => DECIMAL_AMOUNT_FORMATTER.format(value);
