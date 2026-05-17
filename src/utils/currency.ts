/**
 * Format a number as Philippine Peso
 */
export function formatPeso(amount: number, opts?: { compact?: boolean }): string {
  if (opts?.compact) {
    if (amount >= 1_000_000) return `₱${(amount / 1_000_000).toFixed(1)}M`
    if (amount >= 1_000) return `₱${(amount / 1_000).toFixed(1)}K`
  }
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

/**
 * Convert PHP pesos to centavos (for PayMongo API)
 */
export function toCentavos(pesos: number): number {
  return Math.round(pesos * 100)
}

/**
 * Convert centavos to pesos (from PayMongo API)
 */
export function fromCentavos(centavos: number): number {
  return centavos / 100
}

/**
 * Format a number with comma separators (no currency symbol)
 */
export function formatNumber(amount: number): string {
  return new Intl.NumberFormat('en-PH').format(amount)
}
