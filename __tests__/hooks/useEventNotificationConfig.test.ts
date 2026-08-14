import { renderHook, waitFor } from '@testing-library/react-native';
import { useEventNotificationConfig } from '../../hooks/useEventNotificationConfig';
import { supabase } from '../../lib/supabase';

jest.mock('../../lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

const makeConfigChain = (result: { data: unknown; error: unknown }) => ({
  select: jest.fn().mockReturnValue({
    eq: jest.fn().mockReturnValue({
      maybeSingle: jest.fn().mockResolvedValue(result),
    }),
  }),
});

const makeListChain = (result: { data: unknown; error: unknown }) => ({
  select: jest.fn().mockReturnValue({
    eq: jest.fn().mockResolvedValue(result),
  }),
});

describe('useEventNotificationConfig', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns config null and no error when the event has no notification configured (CA1)', async () => {
    (supabase.from as jest.Mock).mockReturnValueOnce(
      makeConfigChain({ data: null, error: null })
    );

    const { result } = renderHook(() => useEventNotificationConfig('event-1'));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.config).toBeNull();
    expect(result.current.reminders).toEqual([]);
    expect(result.current.recipients).toEqual([]);
    expect(result.current.error).toBeNull();
  });

  it('does not query reminders or recipients when there is no config', async () => {
    (supabase.from as jest.Mock).mockReturnValueOnce(
      makeConfigChain({ data: null, error: null })
    );

    const { result } = renderHook(() => useEventNotificationConfig('event-1'));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(supabase.from).toHaveBeenCalledTimes(1);
    expect(supabase.from).toHaveBeenCalledWith('event_notification_configs');
  });

  it('loads config, reminders and recipients when a config exists', async () => {
    const config = { id: 'config-1', event_id: 'event-1', enabled: true };
    const reminders = [{ id: 'r1', config_id: 'config-1', offset_value: 1, offset_unit: 'day' }];
    const recipients = [{ id: 'rc1', config_id: 'config-1', household_member_id: 'hm-1' }];

    (supabase.from as jest.Mock)
      .mockReturnValueOnce(makeConfigChain({ data: config, error: null }))
      .mockReturnValueOnce(makeListChain({ data: reminders, error: null }))
      .mockReturnValueOnce(makeListChain({ data: recipients, error: null }));

    const { result } = renderHook(() => useEventNotificationConfig('event-1'));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.config).toEqual(config);
    expect(result.current.reminders).toEqual(reminders);
    expect(result.current.recipients).toEqual(recipients);
    expect(result.current.error).toBeNull();
  });

  it('sets error when the config query fails', async () => {
    const dbError = { message: 'query failed' };
    (supabase.from as jest.Mock).mockReturnValueOnce(
      makeConfigChain({ data: null, error: dbError })
    );

    const { result } = renderHook(() => useEventNotificationConfig('event-1'));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toEqual(dbError);
    expect(result.current.config).toBeNull();
  });
});
