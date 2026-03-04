const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_EMAIL_LENGTH = 254;

export function normalizeNewsletterEmail(email: string) {
  return email.trim().toLowerCase();
}

export function getNewsletterEmailValidationMessage(email: string): string | null {
  const normalized = normalizeNewsletterEmail(email);

  if (!normalized) {
    return "Email is required.";
  }

  if (normalized.length > MAX_EMAIL_LENGTH) {
    return "Please use a shorter email address.";
  }

  if (!EMAIL_REGEX.test(normalized)) {
    return "Please enter a valid email address.";
  }

  return null;
}
