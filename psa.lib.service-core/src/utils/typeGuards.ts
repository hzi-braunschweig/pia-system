/**
 * Type guard to check and narrow a value to type string[]
 * @param input
 */
export function isArrayOfStrings(input: unknown): input is string[] {
  return (
    Array.isArray(input) && input.every((entry) => typeof entry === 'string')
  );
}
