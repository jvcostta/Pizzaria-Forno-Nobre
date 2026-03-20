import { calculateOrderTotal } from './order-calculator';

describe('calculateOrderTotal', () => {
  const sampleItems = [
    { quantity: 2, unitPrice: 35.0 },
    { quantity: 1, unitPrice: 42.5 },
  ];

  it('deve calcular o total sem desconto', () => {
    const result = calculateOrderTotal(sampleItems, false);

    expect(result.totalValue).toBe(112.5);
    expect(result.discountApplied).toBe(0);
    expect(result.finalValue).toBe(112.5);
  });

  it('deve aplicar 10% de desconto de fidelidade', () => {
    const result = calculateOrderTotal(sampleItems, true);

    expect(result.totalValue).toBe(112.5);
    expect(result.discountApplied).toBe(11.25);
    expect(result.finalValue).toBe(101.25);
  });

  it('deve retornar zero para lista de itens vazia', () => {
    const result = calculateOrderTotal([], false);

    expect(result.totalValue).toBe(0);
    expect(result.discountApplied).toBe(0);
    expect(result.finalValue).toBe(0);
  });

  it('deve arredondar corretamente valores com muitas casas decimais', () => {
    const items = [{ quantity: 3, unitPrice: 33.33 }];
    const result = calculateOrderTotal(items, true);

    expect(result.totalValue).toBe(99.99);
    expect(result.discountApplied).toBe(10.0);
    expect(result.finalValue).toBe(89.99);
  });

  it('deve lidar com item unico', () => {
    const items = [{ quantity: 1, unitPrice: 50.0 }];
    const result = calculateOrderTotal(items, false);

    expect(result.totalValue).toBe(50.0);
    expect(result.finalValue).toBe(50.0);
  });
});
