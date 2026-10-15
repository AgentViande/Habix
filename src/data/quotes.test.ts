import { describe, it, expect } from 'vitest';
import { QUOTES_AND_TIPS, getDailyQuoteIndex, getDailyQuote, getRandomQuote } from './quotes';

describe('Quotes & Conseils du Jour (quotes.ts)', () => {
  it('contains at least 60 entries', () => {
    expect(QUOTES_AND_TIPS.length).toBeGreaterThanOrEqual(60);
  });

  it('all entries have valid text and type (citation or conseil)', () => {
    QUOTES_AND_TIPS.forEach((item) => {
      expect(typeof item.texte).toBe('string');
      expect(item.texte.trim().length).toBeGreaterThan(10);
      expect(['citation', 'conseil']).toContain(item.type);

      if (item.type === 'citation') {
        expect(typeof item.auteur).toBe('string');
        expect(item.auteur?.length).toBeGreaterThan(0);
      }
    });
  });

  it('getDailyQuoteIndex is deterministic and bounded for the same date string', () => {
    const total = QUOTES_AND_TIPS.length;
    const idx1 = getDailyQuoteIndex('2026-10-15', total);
    const idx2 = getDailyQuoteIndex('2026-10-15', total);

    expect(idx1).toBe(idx2);
    expect(idx1).toBeGreaterThanOrEqual(0);
    expect(idx1).toBeLessThan(total);

    const nextDayIdx = getDailyQuoteIndex('2026-10-16', total);
    expect(nextDayIdx).toBeGreaterThanOrEqual(0);
    expect(nextDayIdx).toBeLessThan(total);
  });

  it('getDailyQuote returns the identical quote for the same day', () => {
    const q1 = getDailyQuote('2026-10-15');
    const q2 = getDailyQuote('2026-10-15');
    expect(q1.quote.texte).toBe(q2.quote.texte);
    expect(q1.index).toBe(q2.index);
  });

  it('getRandomQuote returns a valid quote', () => {
    const random = getRandomQuote(0);
    expect(random.quote).toBeDefined();
    expect(random.index).toBeGreaterThanOrEqual(0);
  });
});
