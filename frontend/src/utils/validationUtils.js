export const isPasswordComplex = (password) => {
  if (!password) {
    return false;
  }
  if (password.length < 8 || password.length > 128) {
    return false;
  }
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasDigit = /[0-9]/.test(password);
  const hasSpecialChar = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?~`]/.test(password);

  return hasUppercase && hasLowercase && hasDigit && hasSpecialChar;
};