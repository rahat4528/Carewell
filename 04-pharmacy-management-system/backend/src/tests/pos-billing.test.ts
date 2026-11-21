import { calculatePosTotals, validateTender, CartItem } from '../modules/pos/pos-engine';

describe('Point of Sale (POS) Exact Financial Engine', () => {
  test('calculates line item totals, taxable subtotal, and tax in integer cents without float drift', () => {
    const items: CartItem[] = [
      {
        medicationId: 'med_1',
        name: 'Prescription Amoxicillin',
        quantity: 2,
        unitPriceCents: 1850, // $18.50 -> 3700
        isTaxable: false      // Rx is tax exempt
      },
      {
        medicationId: 'med_2',
        name: 'OTC Ibuprofen',
        quantity: 3,
        unitPriceCents: 1099, // $10.99 -> 3297
        isTaxable: true       // Taxable
      }
    ];

    // Tax rate: 8.25% = 825 basis points
    // Taxable subtotal = 3297 cents
    // Tax = round(3297 * 825 / 10000) = round(272.0025) = 272 cents ($2.72)
    // Subtotal = 3700 + 3297 = 6997 cents ($69.97)
    // Total = 6997 + 272 = 7269 cents ($72.69)
    const receipt = calculatePosTotals(items, 825);

    expect(receipt.subtotalCents).toBe(6997);
    expect(receipt.taxCents).toBe(272);
    expect(receipt.totalCents).toBe(7269);
    expect(receipt.itemCount).toBe(5);
    expect(receipt.items[0].lineTotalCents).toBe(3700);
    expect(receipt.items[1].lineTotalCents).toBe(3297);
  });

  test('validates tender and calculates exact cash change due', () => {
    const totalCents = 7269; // $72.69
    // Customer pays $80.00 cash (8000 cents)
    const tenderResult = validateTender(totalCents, { cashCents: 8000 });

    expect(tenderResult.valid).toBe(true);
    expect(tenderResult.tenderTotalCents).toBe(8000);
    expect(tenderResult.changeDueCents).toBe(731); // $7.31 change
    expect(tenderResult.discrepancyCents).toBe(0);
  });

  test('rejects insufficient tender with exact discrepancy cents', () => {
    const totalCents = 5000;
    const tenderResult = validateTender(totalCents, { cashCents: 3500 });

    expect(tenderResult.valid).toBe(false);
    expect(tenderResult.discrepancyCents).toBe(1500); // Short $15.00
  });

  test('supports split payment across insurance and patient card', () => {
    const totalCents = 10000; // $100.00
    const tenderResult = validateTender(totalCents, {
      insuranceCents: 8000, // Insurance covers $80
      cardCents: 2000      // Patient copay $20
    });

    expect(tenderResult.valid).toBe(true);
    expect(tenderResult.changeDueCents).toBe(0);
  });
});
