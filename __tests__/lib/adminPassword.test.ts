import { getAdminPasswordStrength, MIN_PASSWORD_LENGTH } from '@/lib/adminPassword';

describe('adminPassword', () => {
  it('returns idle for an empty password', () => {
    expect(getAdminPasswordStrength('')).toEqual({ score: 0, tone: 'idle' });
  });

  it('returns weak for a very short password', () => {
    expect(getAdminPasswordStrength('abc')).toEqual({ score: 1, tone: 'weak' });
  });

  it('returns fair for a medium-length password', () => {
    expect(getAdminPasswordStrength('abcdef')).toEqual({ score: 2, tone: 'fair' });
  });

  it('returns good once it reaches the minimum password length', () => {
    expect(getAdminPasswordStrength('abcdefgh'.slice(0, MIN_PASSWORD_LENGTH))).toEqual({
      score: 3,
      tone: 'good',
    });
  });

  it('returns strong for long passwords without enough character variety', () => {
    expect(getAdminPasswordStrength('abcdefghijkl')).toEqual({ score: 4, tone: 'strong' });
  });

  it('returns excellent for long passwords with high character variety', () => {
    expect(getAdminPasswordStrength('Abcdef1234!@')).toEqual({ score: 5, tone: 'excellent' });
  });
});
