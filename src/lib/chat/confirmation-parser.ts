/**
 * Parse user responses for confirmations
 */

export type ConfirmationResponse = 'yes' | 'no' | 'unknown';

/**
 * Positive confirmation phrases
 */
const POSITIVE_PHRASES = [
  'yes',
  'yeah',
  'yep',
  'yup',
  'sure',
  'okay',
  'ok',
  'correct',
  'right',
  'do it',
  'go ahead',
  'proceed',
  'confirm',
  'confirmed',
  'approve',
  'approved',
  'affirmative',
  'absolutely',
  'definitely',
  'please',
  'sounds good',
  'looks good',
  'that works',
  "that's right",
  'exactly',
];

/**
 * Negative confirmation phrases
 */
const NEGATIVE_PHRASES = [
  'no',
  'nope',
  'nah',
  'cancel',
  'stop',
  "don't",
  'do not',
  'negative',
  'incorrect',
  'wrong',
  'not correct',
  'not right',
  "that's wrong",
  "that's not right",
  'nevermind',
  'never mind',
  'abort',
];

/**
 * Parse user input to determine if it's a confirmation, rejection, or unclear
 */
export function parseConfirmation(input: string): ConfirmationResponse {
  const normalized = input.toLowerCase().trim();

  // Check for positive confirmation
  for (const phrase of POSITIVE_PHRASES) {
    if (normalized === phrase || normalized.includes(phrase)) {
      return 'yes';
    }
  }

  // Check for negative confirmation
  for (const phrase of NEGATIVE_PHRASES) {
    if (normalized === phrase || normalized.includes(phrase)) {
      return 'no';
    }
  }

  return 'unknown';
}

/**
 * Check if input is a confirmation (yes or no)
 */
export function isConfirmation(input: string): boolean {
  return parseConfirmation(input) !== 'unknown';
}

/**
 * Check if input is specifically a positive confirmation
 */
export function isPositiveConfirmation(input: string): boolean {
  return parseConfirmation(input) === 'yes';
}

/**
 * Check if input is specifically a negative confirmation
 */
export function isNegativeConfirmation(input: string): boolean {
  return parseConfirmation(input) === 'no';
}

/**
 * Check if input contains a destructive action confirmation
 * (e.g., "yes delete" for permanent deletion)
 */
export function parseDestructiveConfirmation(
  input: string,
  requiredPhrase: string
): boolean {
  const normalized = input.toLowerCase().trim();
  const requiredLower = requiredPhrase.toLowerCase().trim();

  return normalized === requiredLower || normalized.includes(requiredLower);
}



