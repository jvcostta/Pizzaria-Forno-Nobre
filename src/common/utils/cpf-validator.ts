export function isValidCpf(cpf: string): boolean {
  const cleaned = cpf.replace(/\D/g, '');

  if (cleaned.length !== 11) {
    return false;
  }

  if (/^(\d)\1{10}$/.test(cleaned)) {
    return false;
  }

  const digits = cleaned.split('').map(Number);

  const calcDigit = (slice: number[], factor: number): number => {
    const sum = slice.reduce((acc, digit, i) => acc + digit * (factor - i), 0);
    const remainder = sum % 11;
    return remainder < 2 ? 0 : 11 - remainder;
  };

  const firstDigit = calcDigit(digits.slice(0, 9), 10);
  if (firstDigit !== digits[9]) {
    return false;
  }

  const secondDigit = calcDigit(digits.slice(0, 10), 11);
  if (secondDigit !== digits[10]) {
    return false;
  }

  return true;
}
