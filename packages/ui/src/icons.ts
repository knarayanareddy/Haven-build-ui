// ─── Haven Icon Mapping ───
// Maps semantic icon names to MaterialCommunityIcons glyph names.
// Outline variants for in-screen use where detail is visible at larger sizes.

export const havenIcons = {
  home: 'home-outline',
  pills: 'pill',
  shield: 'shield-outline',
  family: 'account-group-outline',
  microphone: 'microphone-outline',
  calendar: 'calendar-outline',
  compass: 'compass-outline',
  neighbourhood: 'home-group',
  hospital: 'hospital-box-outline',
  clipboard: 'clipboard-text-outline',
  document: 'file-document-edit-outline',
  alert: 'alert-outline',
  stethoscope: 'stethoscope',
  lock: 'lock-outline',
  location: 'map-marker-outline',
  brain: 'brain',
  chart: 'chart-bar',
  heart: 'heart-outline',
  chat: 'chat-outline',
  checkCircle: 'check-circle-outline',
  video: 'video-outline',
  handshake: 'handshake-outline',
  phone: 'phone-outline',
  book: 'book-open-variant',
  moon: 'moon-waning-crescent',
  emergency: 'alarm-light-outline',
  settings: 'cog-outline',
  more: 'dots-horizontal',
} as const;

// Filled variants for bottom navigation bar where icons render at ≤24px.
// Solid fills are more legible for elderly users at small sizes.
export const havenNavIcons = {
  home: 'home',
  pills: 'pill',
  shield: 'shield',
  family: 'account-group',
  microphone: 'microphone',
  calendar: 'calendar',
  compass: 'compass',
  stethoscope: 'stethoscope',
  lock: 'lock',
  settings: 'cog',
} as const;

export type HavenIconName = keyof typeof havenIcons;
