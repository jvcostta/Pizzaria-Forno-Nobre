export interface OrderItemInput {
  quantity: number;
  unitPrice: number;
}

export interface OrderCalculation {
  totalValue: number;
  discountApplied: number;
  finalValue: number;
}

const LOYALTY_DISCOUNT_RATE = 0.1;

export function calculateOrderTotal(
  items: OrderItemInput[],
  isDiscountApplied: boolean,
): OrderCalculation {
  const totalValue = items.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice,
    0,
  );

  const discountApplied = isDiscountApplied
    ? round(totalValue * LOYALTY_DISCOUNT_RATE)
    : 0;

  const finalValue = round(totalValue - discountApplied);

  return { totalValue: round(totalValue), discountApplied, finalValue };
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}
