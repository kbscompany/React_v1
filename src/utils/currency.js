// Currency configuration for the application
export const CURRENCY_CONFIG = {
  DEFAULT_CURRENCY: 'EGP',
  CURRENCIES: {
    EGP: {
      code: 'EGP',
      symbol: 'ج.م',
      name: 'Egyptian Pound',
      position: 'after' // Symbol comes after the amount
    },
    USD: {
      code: 'USD', 
      symbol: '$',
      name: 'US Dollar',
      position: 'before'
    },
    EUR: {
      code: 'EUR',
      symbol: '€',
      name: 'Euro',
      position: 'after'
    }
  }
};

export const formatCurrency = (amount, currencyCode = CURRENCY_CONFIG.DEFAULT_CURRENCY) => {
  const currency = CURRENCY_CONFIG.CURRENCIES[currencyCode] || CURRENCY_CONFIG.CURRENCIES.EGP;
  const formattedAmount = Number(amount || 0).toFixed(2);
  
  if (currency.position === 'before') {
    return `${currency.symbol}${formattedAmount}`;
  } else {
    return `${formattedAmount} ${currency.symbol}`;
  }
};

export const getCurrencySymbol = (currencyCode = CURRENCY_CONFIG.DEFAULT_CURRENCY) => {
  return CURRENCY_CONFIG.CURRENCIES[currencyCode]?.symbol || 'ج.م';
};

export const getCurrencyCode = () => CURRENCY_CONFIG.DEFAULT_CURRENCY;

export const formatCurrencyWithCode = (amount, currencyCode = CURRENCY_CONFIG.DEFAULT_CURRENCY) => {
  const formattedAmount = Number(amount || 0).toFixed(2);
  return `${formattedAmount} ${currencyCode}`;
}; 