export type EventStatus = 'pending' | 'done' | 'cancelled';

export type ParameterType = 'text' | 'number' | 'boolean';

export interface ParameterDefinition {
  name: string;
  type: ParameterType;
  unit?: string;
}

export interface Asset {
  id: string;
  name: string;
  category: string;
  icon: string | null;
  parameter_definitions: ParameterDefinition[];
  person_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Person {
  id: string;
  name: string;
  relationship: string | null;
  birth_date: string | null;
  icon: string | null;
  created_at: string;
  updated_at: string;
}

export interface HomeEvent {
  id: string;
  asset_id: string;
  date: string;
  notes: string | null;
  status: EventStatus;
  created_at: string;
  updated_at: string;
}

export interface EventParameterValue {
  id: string;
  event_id: string;
  parameter_name: string;
  parameter_value: string;
  parameter_type: ParameterType;
  created_at: string;
}

export interface EventWithValues extends HomeEvent {
  event_parameter_values: EventParameterValue[];
}

export interface LastEventSummary {
  date: string;
  notes: string | null;
}

export interface AssetWithLastEvent extends Asset {
  lastEvent: LastEventSummary | null;
}

export type RecurrenceType = 'date' | 'interval';

export type NotificationTimeUnit = 'hour' | 'day' | 'week' | 'month' | 'year';

export interface HouseholdMember {
  id: string;
  user_id: string;
  display_name: string;
  created_at: string;
}

export interface EventNotificationConfig {
  id: string;
  event_id: string;
  enabled: boolean;
  recurrence_type: RecurrenceType | null;
  recurrence_date: string | null;
  recurrence_interval_value: number | null;
  recurrence_interval_unit: NotificationTimeUnit | null;
  notify_all_household: boolean;
  created_at: string;
  updated_at: string;
}

export interface EventNotificationReminder {
  id: string;
  config_id: string;
  offset_value: number;
  offset_unit: NotificationTimeUnit;
  created_at: string;
}

export interface EventNotificationRecipient {
  id: string;
  config_id: string;
  household_member_id: string;
  created_at: string;
}
