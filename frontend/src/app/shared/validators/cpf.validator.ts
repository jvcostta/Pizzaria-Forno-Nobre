import { AbstractControl, ValidationErrors } from '@angular/forms';

export function isValidCpf(cpf: string): boolean {
  const cleaned = cpf.replace(/\D/g, '');

  if (cleaned.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cleaned)) return false;

  const digits = cleaned.split('').map(Number);

  const calcDigit = (slice: number[], factor: number): number => {
    const sum = slice.reduce((acc, digit, i) => acc + digit * (factor - i), 0);
    const remainder = sum % 11;
    return remainder < 2 ? 0 : 11 - remainder;
  };

  const firstDigit = calcDigit(digits.slice(0, 9), 10);
  if (firstDigit !== digits[9]) return false;

  const secondDigit = calcDigit(digits.slice(0, 10), 11);
  if (secondDigit !== digits[10]) return false;

  return true;
}

export function cpfValidator(control: AbstractControl): ValidationErrors | null {
  const value = control.value;
  if (!value) return null;

  const cleaned = value.replace(/\D/g, '');
  if (cleaned.length === 0) return null;
  if (cleaned.length !== 11) return { cpfInvalid: true };
  if (!isValidCpf(cleaned)) return { cpfInvalid: true };

  return null;
}

export function formatCpf(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

export function unformatCpf(value: string): string {
  return value.replace(/\D/g, '');
}
