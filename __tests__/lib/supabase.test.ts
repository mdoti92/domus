import { supabase } from '../../lib/supabase';

describe('supabase client', () => {
  it('is initialized', () => {
    expect(supabase).toBeDefined();
  });

  it('exposes auth module', () => {
    expect(supabase.auth).toBeDefined();
  });

  it('exposes from query builder', () => {
    expect(supabase.from).toBeDefined();
  });
});
