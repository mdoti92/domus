import { renderHook, act } from '@testing-library/react-native';
import {
  useSaveEventNotificationConfig,
  SaveEventNotificationConfigInput,
} from '../../hooks/useSaveEventNotificationConfig';
import { supabase } from '../../lib/supabase';

jest.mock('../../lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

const upsertMock = jest.fn();
const insertRemindersMock = jest.fn();
const insertRecipientsMock = jest.fn();

const makeConfigsChain = (result: { data: unknown; error: unknown }) => ({
  upsert: upsertMock.mockReturnValue({
    select: jest.fn().mockReturnValue({
      single: jest.fn().mockResolvedValue(result),
    }),
  }),
});

const makeDeleteChain = (result: { error: unknown } = { error: null }) => ({
  delete: jest.fn().mockReturnValue({
    eq: jest.fn().mockResolvedValue(result),
  }),
});

const makeRemindersInsertChain = (result: { error: unknown } = { error: null }) => ({
  insert: insertRemindersMock.mockResolvedValue(result),
});

const makeRecipientsInsertChain = (result: { error: unknown } = { error: null }) => ({
  insert: insertRecipientsMock.mockResolvedValue(result),
});

const baseInput: SaveEventNotificationConfigInput = {
  enabled: true,
  recurrence_type: 'date',
  recurrence_date: '2026-12-25T00:00:00+00:00',
  recurrence_interval_value: null,
  recurrence_interval_unit: null,
  notify_all_household: true,
  reminders: [],
  recipient_household_member_ids: [],
};

describe('useSaveEventNotificationConfig', () => {
  beforeEach(() => jest.clearAllMocks());

  it('persists recurrence_date and nulls interval fields when recurrence_type=date (CA2)', async () => {
    (supabase.from as jest.Mock)
      .mockReturnValueOnce(makeConfigsChain({ data: { id: 'config-1' }, error: null }))
      .mockReturnValueOnce(makeDeleteChain()) // reminders delete
      .mockReturnValueOnce(makeDeleteChain()); // recipients delete

    const { result } = renderHook(() => useSaveEventNotificationConfig());

    await act(async () => {
      await result.current.saveConfig('event-1', baseInput);
    });

    expect(upsertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        recurrence_type: 'date',
        recurrence_date: '2026-12-25T00:00:00+00:00',
        recurrence_interval_value: null,
        recurrence_interval_unit: null,
      }),
      { onConflict: 'event_id' }
    );
  });

  it('persists interval fields and nulls recurrence_date when recurrence_type=interval (CA3)', async () => {
    (supabase.from as jest.Mock)
      .mockReturnValueOnce(makeConfigsChain({ data: { id: 'config-1' }, error: null }))
      .mockReturnValueOnce(makeDeleteChain())
      .mockReturnValueOnce(makeDeleteChain());

    const { result } = renderHook(() => useSaveEventNotificationConfig());

    await act(async () => {
      await result.current.saveConfig('event-1', {
        ...baseInput,
        recurrence_type: 'interval',
        recurrence_date: null,
        recurrence_interval_value: 6,
        recurrence_interval_unit: 'month',
      });
    });

    expect(upsertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        recurrence_type: 'interval',
        recurrence_date: null,
        recurrence_interval_value: 6,
        recurrence_interval_unit: 'month',
      }),
      { onConflict: 'event_id' }
    );
  });

  it('saves multiple reminders with no limit (CA4)', async () => {
    (supabase.from as jest.Mock)
      .mockReturnValueOnce(makeConfigsChain({ data: { id: 'config-1' }, error: null }))
      .mockReturnValueOnce(makeDeleteChain()) // reminders delete
      .mockReturnValueOnce(makeRemindersInsertChain()) // reminders insert
      .mockReturnValueOnce(makeDeleteChain()); // recipients delete

    const { result } = renderHook(() => useSaveEventNotificationConfig());

    await act(async () => {
      await result.current.saveConfig('event-1', {
        ...baseInput,
        reminders: [
          { offset_value: 1, offset_unit: 'week' },
          { offset_value: 1, offset_unit: 'day' },
        ],
      });
    });

    expect(insertRemindersMock).toHaveBeenCalledWith([
      { config_id: 'config-1', offset_value: 1, offset_unit: 'week' },
      { config_id: 'config-1', offset_value: 1, offset_unit: 'day' },
    ]);
  });

  it('does not create recipient rows when notify_all_household=true (CA5)', async () => {
    (supabase.from as jest.Mock)
      .mockReturnValueOnce(makeConfigsChain({ data: { id: 'config-1' }, error: null }))
      .mockReturnValueOnce(makeDeleteChain())
      .mockReturnValueOnce(makeDeleteChain());

    const { result } = renderHook(() => useSaveEventNotificationConfig());

    await act(async () => {
      await result.current.saveConfig('event-1', {
        ...baseInput,
        notify_all_household: true,
        recipient_household_member_ids: ['hm-1', 'hm-2'],
      });
    });

    expect(insertRecipientsMock).not.toHaveBeenCalled();
  });

  it('saves selected recipients when notify_all_household=false (CA6)', async () => {
    (supabase.from as jest.Mock)
      .mockReturnValueOnce(makeConfigsChain({ data: { id: 'config-1' }, error: null }))
      .mockReturnValueOnce(makeDeleteChain()) // reminders delete
      .mockReturnValueOnce(makeDeleteChain()) // recipients delete
      .mockReturnValueOnce(makeRecipientsInsertChain()); // recipients insert

    const { result } = renderHook(() => useSaveEventNotificationConfig());

    await act(async () => {
      await result.current.saveConfig('event-1', {
        ...baseInput,
        notify_all_household: false,
        recipient_household_member_ids: ['hm-1', 'hm-2'],
      });
    });

    expect(insertRecipientsMock).toHaveBeenCalledWith([
      { config_id: 'config-1', household_member_id: 'hm-1' },
      { config_id: 'config-1', household_member_id: 'hm-2' },
    ]);
  });

  it('throws and sets error when the config upsert fails', async () => {
    const dbError = { message: 'upsert failed' };
    (supabase.from as jest.Mock).mockReturnValueOnce(
      makeConfigsChain({ data: null, error: dbError })
    );

    const { result } = renderHook(() => useSaveEventNotificationConfig());

    let thrownError: unknown;
    await act(async () => {
      try {
        await result.current.saveConfig('event-1', baseInput);
      } catch (e) {
        thrownError = e;
      }
    });

    expect(thrownError).toEqual(dbError);
    expect(result.current.error).toEqual(dbError);
  });
});
