// ─── Vision Screen Registry ───
// Each screen exports a render function: (ctx: ScreenContext) => React.ReactNode
// These replace the inline render functions in ScreenRenderer.tsx
// with the rich UI from the havenUIvision design spec.

export { renderVisionHome } from './HomeScreen';
export { renderVisionToday } from './TodayScreen';
export { renderVisionPills } from './PillsScreen';
export { renderVisionShield } from './ShieldScreen';
export { renderVisionFamily } from './FamilyScreen';
export { renderVisionBuurt } from './BuurtScreen';
export { renderVisionKompas } from './KompasScreen';
export { renderVisionStem } from './StemScreen';
export { renderVisionWacht } from './WachtScreen';
export { renderVisionSettings } from './SettingsScreen';
export { renderVisionMore } from './MoreScreen';
