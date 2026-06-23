/**
 * Tests for geo utility functions
 */

import { describe, it, expect } from 'vitest';
import { haversine, fmtDistance } from './geo';

describe('haversine', () => {
  it('returns 0 for same point', () => {
    const result = haversine(-26.2041, 28.0473, -26.2041, 28.0473);
    expect(result).toBe(0);
  });

  it('calculates distance between Johannesburg and Pretoria (~58km)', () => {
    // Johannesburg CBD
    const jhbLat = -26.2041;
    const jhbLng = 28.0473;
    // Pretoria CBD
    const ptaLat = -25.7479;
    const ptaLng = 28.2293;

    const distance = haversine(jhbLat, jhbLng, ptaLat, ptaLng);

    // Should be approximately 58km (allowing 5km tolerance)
    expect(distance).toBeGreaterThan(53000);
    expect(distance).toBeLessThan(63000);
  });

  it('calculates distance between Sandton and Soweto (~25km)', () => {
    // Sandton
    const sandtonLat = -26.1076;
    const sandtonLng = 28.0567;
    // Soweto (Orlando)
    const sowetoLat = -26.2485;
    const sowetoLng = 27.854;

    const distance = haversine(sandtonLat, sandtonLng, sowetoLat, sowetoLng);

    // Should be approximately 25km (allowing 5km tolerance)
    expect(distance).toBeGreaterThan(20000);
    expect(distance).toBeLessThan(30000);
  });

  it('is symmetric (A to B equals B to A)', () => {
    const d1 = haversine(-26.2041, 28.0473, -25.7479, 28.2293);
    const d2 = haversine(-25.7479, 28.2293, -26.2041, 28.0473);
    expect(d1).toBeCloseTo(d2, 2);
  });
});

describe('fmtDistance', () => {
  it('formats distances under 1km in meters (no space)', () => {
    expect(fmtDistance(500)).toBe('500m');
    expect(fmtDistance(999)).toBe('999m');
    expect(fmtDistance(100)).toBe('100m');
  });

  it('formats distances 1km+ in kilometers (with space)', () => {
    expect(fmtDistance(1000)).toBe('1.0 km');
    expect(fmtDistance(1500)).toBe('1.5 km');
    expect(fmtDistance(10000)).toBe('10.0 km');
  });

  it('rounds distances appropriately', () => {
    expect(fmtDistance(1234)).toBe('1.2 km');
    expect(fmtDistance(1999)).toBe('2.0 km');
    expect(fmtDistance(567)).toBe('567m');
  });
});
