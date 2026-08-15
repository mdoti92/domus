import {
  isTokenExpired,
  describeConnectionStatus,
} from '../../lib/googleCalendarConnection';

describe('isTokenExpired', () => {
  const now = new Date('2026-08-15T12:00:00Z');

  it('returns true when there is no stored expiry', () => {
    expect(isTokenExpired(null, now)).toBe(true);
  });

  it('returns true when the expiry is in the past', () => {
    expect(isTokenExpired('2026-08-15T11:00:00Z', now)).toBe(true);
  });

  it('returns true when the expiry is within the refresh buffer', () => {
    expect(isTokenExpired('2026-08-15T12:00:30Z', now)).toBe(true);
  });

  it('returns false when the expiry is safely in the future', () => {
    expect(isTokenExpired('2026-08-15T13:00:00Z', now)).toBe(false);
  });
});

describe('describeConnectionStatus', () => {
  it('describes not_connected as not needing reconnection', () => {
    const result = describeConnectionStatus('not_connected');
    expect(result.needsReconnect).toBe(false);
  });

  it('describes connected as not needing reconnection (CA1/CA4)', () => {
    const result = describeConnectionStatus('connected');
    expect(result.needsReconnect).toBe(false);
    expect(result.label).toMatch(/conectad/i);
  });

  it('describes expired as needing reconnection with a clear message (CA3)', () => {
    const result = describeConnectionStatus('expired');
    expect(result.needsReconnect).toBe(true);
    expect(result.detail.length).toBeGreaterThan(0);
  });

  it('describes revoked as needing reconnection with a clear message (CA3)', () => {
    const result = describeConnectionStatus('revoked');
    expect(result.needsReconnect).toBe(true);
    expect(result.detail.length).toBeGreaterThan(0);
  });
});
