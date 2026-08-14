import { renderHook, waitFor } from '@testing-library/react-native';
import { useHouseholdMembers } from '../../hooks/useHouseholdMembers';
import { supabase } from '../../lib/supabase';
import { HouseholdMember } from '../../types';

jest.mock('../../lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

const makeMember = (overrides: Partial<HouseholdMember> = {}): HouseholdMember => ({
  id: '1',
  user_id: 'user-1',
  display_name: 'Martín',
  created_at: '2026-01-01T00:00:00Z',
  ...overrides,
});

const mockSelectChain = (result: { data: HouseholdMember[] | null; error: unknown }) => ({
  select: jest.fn().mockReturnValue({
    order: jest.fn().mockResolvedValue(result),
  }),
});

describe('useHouseholdMembers', () => {
  beforeEach(() => jest.clearAllMocks());

  it('starts with loading true', () => {
    (supabase.from as jest.Mock).mockReturnValue(mockSelectChain({ data: [], error: null }));

    const { result } = renderHook(() => useHouseholdMembers());
    expect(result.current.loading).toBe(true);
  });

  it('returns household members after successful fetch', async () => {
    const members = [makeMember(), makeMember({ id: '2', display_name: 'Flor' })];
    (supabase.from as jest.Mock).mockReturnValue(mockSelectChain({ data: members, error: null }));

    const { result } = renderHook(() => useHouseholdMembers());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.members).toEqual(members);
    expect(result.current.error).toBeNull();
  });

  it('returns empty array when there are no members', async () => {
    (supabase.from as jest.Mock).mockReturnValue(mockSelectChain({ data: [], error: null }));

    const { result } = renderHook(() => useHouseholdMembers());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.members).toEqual([]);
  });

  it('sets error when supabase fails', async () => {
    const dbError = { message: 'Network error' };
    (supabase.from as jest.Mock).mockReturnValue(mockSelectChain({ data: null, error: dbError }));

    const { result } = renderHook(() => useHouseholdMembers());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toEqual(dbError);
    expect(result.current.members).toEqual([]);
  });
});
