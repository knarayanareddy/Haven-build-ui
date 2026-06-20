export interface RealtimeSubscriptionSpec {
  channel: string;
  table: string;
  filter: string;
  permission: string;
}

export const familyRealtimeSubscriptions: RealtimeSubscriptionSpec[] = [
  { channel: 'scam-alerts', table: 'scam_events', filter: "alert_level=in.(rood,zwart)", permission: 'can_view_alerts' },
  { channel: 'medication-status', table: 'medication_reminders', filter: 'elder_id=eq.:elderId', permission: 'can_view_medications' },
  { channel: 'family-messages', table: 'family_messages', filter: 'elder_id=eq.:elderId', permission: 'can_view_messages' },
  { channel: 'notifications', table: 'notifications', filter: 'recipient_id=eq.:profileId', permission: 'self' },
  { channel: 'location-events', table: 'location_events', filter: 'event_type=eq.veilige_zone_verlaten', permission: 'can_view_location_events' },
];

export function resolveRealtimeFilter(template: string, values: Record<string, string>) {
  return template.replace(/:([A-Za-z0-9_]+)/g, (_, key) => values[key] ?? '');
}
