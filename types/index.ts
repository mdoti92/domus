export type ModuleType = 'maintenance' | 'obra' | 'medical' | 'calendar';

export type EventStatus = 'pending' | 'done' | 'cancelled';

export interface BaseEvent {
  id: string;
  module_type: ModuleType;
  title: string;
  description: string | null;
  date: string;
  status: EventStatus;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export type ParameterType = 'text' | 'number' | 'boolean';

export interface ParameterDefinition {
  name: string;
  type: ParameterType;
  unit?: string;
}

export interface ParameterValue {
  name: string;
  type: ParameterType;
  value: string | number | boolean;
}

export interface Asset {
  id: string;
  name: string;
  category: string;
  parameter_definitions: ParameterDefinition[];
  created_at: string;
  updated_at: string;
}

export interface MaintenanceEvent {
  id: string;
  event_id: string;
  asset_id: string;
  parameters: ParameterValue[];
  created_at: string;
}

export interface ObraEvent {
  id: string;
  event_id: string;
  contractor: string | null;
  notes: string | null;
  created_at: string;
}
