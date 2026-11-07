import { isValidEmail } from '@/lib/emailValidation';

describe('isValidEmail', () => {
  it('accepts email addresses with a domain and a sufficiently long top-level domain', () => {
    expect(isValidEmail('writer@example.com')).toBe(true);
    expect(isValidEmail('writer@localhost.dev', 2)).toBe(true);
  });

  it('rejects missing local parts, domains, separators, and whitespace', () => {
    expect(isValidEmail('@example.com')).toBe(false);
    expect(isValidEmail('writer@')).toBe(false);
    expect(isValidEmail('writer@example')).toBe(false);
    expect(isValidEmail('writer@@example.com')).toBe(false);
    expect(isValidEmail('writer name@example.com')).toBe(false);
    expect(isValidEmail('writer@example.')).toBe(false);
  });

  it('honors the minimum top-level-domain length', () => {
    expect(isValidEmail('writer@example.c')).toBe(true);
    expect(isValidEmail('writer@example.c', 2)).toBe(false);
  });
});
