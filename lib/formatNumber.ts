/**
 * Formats a number with space as thousand separator
 * Example: 1000000000 -> "1 000 000 000"
 */
export function formatNumberWithSpaces(value: string | number): string {
  if (value === '' || value === null || value === undefined) return '';
  
  // Convert to string and remove all non-digit characters except decimal point
  const stringValue = String(value).replace(/[^\d.]/g, '');
  
  if (stringValue === '' || stringValue === '.') return '';
  
  // Split by decimal point
  const parts = stringValue.split('.');
  const integerPart = parts[0];
  const decimalPart = parts[1];
  
  // Format integer part with spaces
  const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  
  // Combine with decimal part if exists
  return decimalPart !== undefined ? `${formattedInteger}.${decimalPart}` : formattedInteger;
}

/**
 * Parses a formatted number string back to a plain number string
 * Example: "1 000 000 000" -> "1000000000"
 */
export function parseFormattedNumber(value: string): string {
  if (!value) return '';
  
  // Remove all spaces and keep only digits and decimal point
  return value.replace(/\s/g, '').replace(/[^\d.]/g, '');
}

/**
 * Gets the numeric value from a formatted string
 */
export function getNumericValue(value: string): number {
  const parsed = parseFormattedNumber(value);
  return parsed === '' ? 0 : parseFloat(parsed) || 0;
}











