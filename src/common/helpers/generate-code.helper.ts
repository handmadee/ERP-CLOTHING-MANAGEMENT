/**
 * Generates a unique code with a prefix and padded numbers
 * @param prefix - The prefix for the code
 * @param lastNumber - The last used number
 * @param padding - The number of digits to pad
 * @returns The generated code
 */
export function generateCode(prefix: string, lastNumber: number, padding: number = 6): string {
    const paddedNumber = String(lastNumber + 1).padStart(padding, '0');
    return `${prefix}${paddedNumber}`;
} 