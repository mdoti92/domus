import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useDueNotifications } from '../../hooks/useDueNotifications';
import { supabase } from '../../lib/supabase';

jest.mock('../../lib/supabase', () => ({
  supabase: {
    auth: { getUser: jest.fn() },
    from: jest.fn(),
  },
}));

const PAST_DATE = '2020-01-01T00:00:00+00:00';
const FUTURE_DATE = '2099-01-01T00:00:00+00:00';

const makeMemberChain = (result: { data: unknown; error: unknown }) => ({
  select: jest.fn().mockReturnValue({
    eq: jest.fn().mockReturnValue({
      maybeSingle: jest.fn().mockResolvedValue(result),
    }),
  }),
});

const makeEventsChain = (result: { data: unknown; error: unknown }) => ({
  select: jest.fn().mockReturnValue({
    eq: jest.fn().mockResolvedValue(result),
  }),
});

const makeDismissedSelectChain = (result: { data: unknown; error: unknown }) => ({
  select: jest.fn().mockReturnValue({
    eq: jest.fn().mockResolvedValue(result),
  }),
});

const dueEventRow = {
  id: 'event-1',
  date: '2019-01-01T00:00:00+00:00',
  assets: { name: 'Piscina' },
  event_notification_configs: {
    enabled: true,
    recurrence_type: 'date',
    recurrence_date: PAST_DATE,
    recurrence_interval_value: null,
    recurrence_interval_unit: null,
    notify_all_household: true,
    event_notification_reminders: [{ offset_value: 1, offset_unit: 'day' }],
    event_notification_recipients: [],
  },
};

function mockHappyPath(eventsData: unknown[] = [dueEventRow]) {
  (supabase.auth.getUser as jest.Mock).mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null });
  (supabase.from as jest.Mock)
    .mockReturnValueOnce(makeMemberChain({ data: { id: 'member-1' }, error: null }))
    .mockReturnValueOnce(makeEventsChain({ data: eventsData, error: null }))
    .mockReturnValueOnce(makeDismissedSelectChain({ data: [], error: null }));
}

describe('useDueNotifications', () => {
  beforeEach(() => jest.clearAllMocks());

  it('starts with loading true', () => {
    mockHappyPath();
    const { result } = renderHook(() => useDueNotifications());
    expect(result.current.loading).toBe(true);
  });

  it('returns due items for the current user', async () => {
    mockHappyPath();

    const { result } = renderHook(() => useDueNotifications());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0].assetName).toBe('Piscina');
    expect(result.current.error).toBeNull();
  });

  it('excludes reminders that are not yet due', async () => {
    mockHappyPath([
      {
        ...dueEventRow,
        event_notification_configs: { ...dueEventRow.event_notification_configs, recurrence_date: FUTURE_DATE },
      },
    ]);

    const { result } = renderHook(() => useDueNotifications());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.items).toEqual([]);
  });

  it('sets error and empty items when there is no authenticated user', async () => {
    (supabase.auth.getUser as jest.Mock).mockResolvedValue({ data: { user: null }, error: { message: 'no session' } });

    const { result } = renderHook(() => useDueNotifications());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.items).toEqual([]);
    expect(result.current.error).toEqual({ message: 'no session' });
  });

  describe('dismiss', () => {
    it('inserts a dismissed_reminders row and removes the item from the list', async () => {
      mockHappyPath();
      const insertMock = jest.fn().mockResolvedValue({ error: null });

      const { result } = renderHook(() => useDueNotifications());
      await waitFor(() => expect(result.current.loading).toBe(false));
      expect(result.current.items).toHaveLength(1);

      (supabase.from as jest.Mock).mockReturnValueOnce({ insert: insertMock });

      await act(async () => {
        await result.current.dismiss('event-1', 1, 'day');
      });

      expect(insertMock).toHaveBeenCalledWith({
        event_id: 'event-1',
        household_member_id: 'member-1',
        offset_value: 1,
        offset_unit: 'day',
      });
      expect(result.current.items).toEqual([]);
    });
  });
});
