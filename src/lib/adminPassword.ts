export const MIN_PASSWORD_LENGTH = 8;
const STRONG_PASSWORD_LENGTH = 12;

export type AdminPasswordStrengthTone = 'idle' | 'weak' | 'fair' | 'good' | 'strong' | 'excellent';

export type AdminPasswordStrength = {
  score: number;
  tone: AdminPasswordStrengthTone;
};

export const getAdminPasswordStrength = (password: string): AdminPasswordStrength => {
  const value = password;
  if (value === '') {
    return { score: 0, tone: 'idle' };
  }

  const characterGroups = [
    /[a-z]/.test(value),
    /[A-Z]/.test(value),
    /\d/.test(value),
    /[^A-Za-z0-9]/.test(value),
  ].filter(Boolean).length;

  let score = 1;
  if (value.length >= 6) score += 1;
  if (value.length >= MIN_PASSWORD_LENGTH) score += 1;
  if (value.length >= STRONG_PASSWORD_LENGTH) score += 1;
  if (characterGroups >= 3) score += 1;

  if (score <= 1) {
    return { score, tone: 'weak' };
  }
  if (score === 2) {
    return { score, tone: 'fair' };
  }
  if (score === 3) {
    return { score, tone: 'good' };
  }
  if (score === 4) {
    return { score, tone: 'strong' };
  }

  return { score, tone: 'excellent' };
};
