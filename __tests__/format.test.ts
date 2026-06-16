import { formatAmountInput, formatMoney, groupDigits, splitEuro } from '../utils/format';

describe('groupDigits', () => {
  it('inserts dot thousands separators', () => {
    expect(groupDigits('1234500')).toBe('1.234.500');
    expect(groupDigits('999')).toBe('999');
    expect(groupDigits('1000')).toBe('1.000');
  });
});

describe('formatAmountInput (live input grouping)', () => {
  it('groups the integer part as the user types', () => {
    expect(formatAmountInput('1234500')).toBe('1.234.500');
    expect(formatAmountInput('1000')).toBe('1.000');
  });

  it('keeps a single comma decimal, max two digits', () => {
    expect(formatAmountInput('1234,5')).toBe('1.234,5');
    expect(formatAmountInput('1234,567')).toBe('1.234,56');
    expect(formatAmountInput('12,3,4')).toBe('12,34');
  });

  it('strips stray characters and leading zeros', () => {
    expect(formatAmountInput('a1b2c3')).toBe('123');
    expect(formatAmountInput('00042')).toBe('42');
  });

  it('round-trips with formatMoney via the Greek convention', () => {
    expect(formatMoney(1234500, 'EUR')).toBe('1.234.500,00 €');
    expect(splitEuro(1642.5)).toEqual({ whole: '1.642', cents: '50' });
  });
});
