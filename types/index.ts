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
