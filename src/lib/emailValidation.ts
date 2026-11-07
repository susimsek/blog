export const isValidEmail = (email: string, minimumTopLevelDomainLength = 1): boolean => {
  const [localPart, domain = '', ...extraParts] = email.split('@');
  if (!localPart || !domain || extraParts.length > 0) {
    return false;
  }

  for (const character of email) {
    if (character.trim() === '') {
      return false;
    }
  }

  const finalDotIndex = domain.lastIndexOf('.');
  return finalDotIndex > 0 && domain.length - finalDotIndex - 1 >= minimumTopLevelDomainLength;
};
