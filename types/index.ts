export type ModuleType = 'maintenance' | 'obra' | 'medical' | 'calendar';

export type EventStatus = 'pending' | 'done' | 'cancelled';

export interface BaseEvent {
  id: string;
  module_type: ModuleType;
  title: string;
  description: string | null;
  date: string;
  status: EventStatus;
  created_by: string;
  created_at: string;
  updated_at: string;
}
