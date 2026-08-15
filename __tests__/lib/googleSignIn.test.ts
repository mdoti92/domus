import { extractOAuthCode } from '../../lib/googleSignIn';

describe('extractOAuthCode', () => {
  it('extracts the code query param from a native deep link redirect (CA3)', () => {
    expect(extractOAuthCode('domus:///?code=abc123')).toBe('abc123');
  });

  it('extracts the code query param from a web redirect', () => {
    expect(extractOAuthCode('https://domus.app/?code=xyz789&other=1')).toBe('xyz789');
  });

  it('returns null when there is no code param', () => {
    expect(extractOAuthCode('domus:///?error=access_denied')).toBeNull();
  });

  it('returns null for a malformed URL instead of throwing', () => {
    expect(extractOAuthCode('not a url')).toBeNull();
  });
});
