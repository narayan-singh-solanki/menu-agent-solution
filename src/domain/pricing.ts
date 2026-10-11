import type { PriceAndTax, StoreConfig, TaxClass } from './types';

export function roundRatioHalfUp(numerator: number, denominator: number): number {
  if (!Number.isSafeInteger(numerator) || numerator < 0) {
    throw new Error(`Expected a non-negative safe integer numerator: ${numerator}`);
  }
  if (!Number.isSafeInteger(denominator) || denominator <= 0) {
    throw new Error(`Expected a positive safe integer denominator: ${denominator}`);
  }
  return Math.floor((2 * numerator + denominator) / (2 * denominator));
}

export function calculatePriceAndTax(
  priceInCents: number,
  taxClass: TaxClass,
  store: StoreConfig,
): PriceAndTax {
  if(taxClass === 'exempt') {
    return { gross: priceInCents, tax: 0};
  }

  const rateBp = store.tax.rate_bp;
  const BASE_100_PERCENT = 10000;
  const numerator = priceInCents * rateBp;

  if(store.tax.inclusive) {
    const denominator = BASE_100_PERCENT + rateBp;

    return {
      gross: priceInCents, 
      tax: roundRatioHalfUp(numerator, denominator)
    }
  } else {
    const denominator = BASE_100_PERCENT;
    const calculatedTax = roundRatioHalfUp(numerator, denominator);

    return {
      gross: priceInCents + calculatedTax,
      tax: calculatedTax
    }
  }
}
