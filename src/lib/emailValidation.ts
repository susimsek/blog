export const isValidEmail = (email: string, minimumTopLevelDomainLength = 1): boolean => {
  const atIndex = email.indexOf('@');
  if (atIndex <= 0 || email.indexOf('@', atIndex + 1) !== -1) {
    return false;
  }

  for (const character of email) {
    if (character.trim() === '') {
      return false;
    }
  }

  const finalDotIndex = email.lastIndexOf('.');
  const domainStartIndex = atIndex + 1;
  return finalDotIndex > domainStartIndex && email.length - finalDotIndex - 1 >= minimumTopLevelDomainLength;
};
