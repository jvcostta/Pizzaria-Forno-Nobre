import { isValidCpf } from './cpf-validator';

describe('isValidCpf', () => {
  describe('CPFs validos', () => {
    it.each([
      ['52998224725'],
      ['39053344705'],
      ['11144477735'],
      ['98765432100'],
    ])('deve aceitar o CPF %s', (cpf) => {
      expect(isValidCpf(cpf)).toBe(true);
    });

    it('deve aceitar CPF com formatacao', () => {
      expect(isValidCpf('529.982.247-25')).toBe(true);
    });
  });

  describe('CPFs invalidos', () => {
    it.each([
      ['00000000000'],
      ['11111111111'],
      ['22222222222'],
      ['99999999999'],
    ])('deve rejeitar CPF com todos os digitos iguais: %s', (cpf) => {
      expect(isValidCpf(cpf)).toBe(false);
    });

    it('deve rejeitar CPF com tamanho incorreto', () => {
      expect(isValidCpf('1234567890')).toBe(false);
      expect(isValidCpf('123456789012')).toBe(false);
      expect(isValidCpf('')).toBe(false);
    });

    it('deve rejeitar CPF com primeiro digito verificador errado', () => {
      expect(isValidCpf('52998224715')).toBe(false);
    });

    it('deve rejeitar CPF com segundo digito verificador errado', () => {
      expect(isValidCpf('52998224726')).toBe(false);
    });

    it('deve rejeitar CPF completamente aleatorio', () => {
      expect(isValidCpf('12345678901')).toBe(false);
    });
  });
});
