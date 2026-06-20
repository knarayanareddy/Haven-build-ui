// ─── Vision UI Shared Components ───
// React Native components matching the havenUIvision design language.
// Used across all 3 apps (elder, carer, grandchild/family).

import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, radius, touch } from './tokens';
import { statusColors } from './visionColors';

// ─── GradientCard ───
export interface GradientCardProps {
  gradient: [string, string];
  icon?: string;
  title: string;
  subtitle?: string;
  badge?: number;
  onPress?: () => void;
  style?: object;
}

export function GradientCard({ gradient, icon, title, subtitle, badge, onPress, style }: GradientCardProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : 'none'}
      accessibilityLabel={title}
      activeOpacity={0.85}
      style={style}
    >
      <LinearGradient
        colors={gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          borderRadius: radius.card,
          padding: 18,
          minHeight: touch.minimum * 1.5,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <View style={{ flex: 1, gap: 4 }}>
          {icon ? <Text style={{ fontSize: 28 }}>{icon}</Text> : null}
          <Text style={{ fontSize: 20, fontWeight: '900', color: '#FFFFFF' }}>{title}</Text>
          {subtitle ? <Text style={{ fontSize: 14, fontWeight: '700', color: 'rgba(255,255,255,0.85)' }}>{subtitle}</Text> : null}
        </View>
        {badge !== undefined && badge > 0 ? (
          <View style={{ minWidth: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.3)', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 6 }}>
            <Text style={{ color: '#FFFFFF', fontWeight: '900', fontSize: 14 }}>{badge}</Text>
          </View>
        ) : null}
      </LinearGradient>
    </TouchableOpacity>
  );
}

// ─── StatusBadge ───
export interface StatusBadgeProps {
  status: 'green' | 'amber' | 'red';
  label: string;
  pulse?: boolean;
}

export function StatusBadge({ status, label }: StatusBadgeProps) {
  const bg = status === 'green' ? statusColors.greenBg : status === 'amber' ? statusColors.amberBg : statusColors.redBg;
  const fg = status === 'green' ? statusColors.green : status === 'amber' ? statusColors.amber : statusColors.red;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: bg, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, alignSelf: 'flex-start' }}>
      <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: fg }} />
      <Text style={{ fontSize: 14, fontWeight: '800', color: fg }}>{label}</Text>
    </View>
  );
}

// ─── ProgressBar ───
export interface ProgressBarProps {
  progress: number; // 0..1
  color?: string;
  height?: number;
  showLabel?: boolean;
}

export function ProgressBar({ progress, color, height = 10, showLabel }: ProgressBarProps) {
  const pct = Math.max(0, Math.min(1, progress));
  const fg = color ?? colors.sage;
  return (
    <View style={{ gap: 4 }}>
      <View style={{ height, borderRadius: height / 2, backgroundColor: colors.mist, overflow: 'hidden' }}>
        <View style={{ height, borderRadius: height / 2, backgroundColor: fg, width: `${pct * 100}%` }} />
      </View>
      {showLabel ? <Text style={{ fontSize: 13, fontWeight: '800', color: fg, textAlign: 'right' }}>{Math.round(pct * 100)}%</Text> : null}
    </View>
  );
}

// ─── SubTabBar ───
export interface SubTab {
  id: string;
  label: string;
  icon?: string;
}

export interface SubTabBarProps {
  tabs: SubTab[];
  activeTab: string;
  onTabChange: (id: string) => void;
}

export function SubTabBar({ tabs, activeTab, onTabChange }: SubTabBarProps) {
  return (
    <View style={{ flexDirection: 'row', gap: 4, backgroundColor: colors.mist, borderRadius: 14, padding: 3 }}>
      {tabs.map((tab) => (
        <TouchableOpacity
          key={tab.id}
          accessibilityRole="tab"
          accessibilityLabel={tab.label}
          accessibilityState={{ selected: tab.id === activeTab }}
          onPress={() => onTabChange(tab.id)}
          style={{
            flex: 1,
            paddingVertical: 10,
            paddingHorizontal: 8,
            borderRadius: 12,
            backgroundColor: tab.id === activeTab ? colors.paper : 'transparent',
            alignItems: 'center',
          }}
        >
          <Text style={{ fontSize: 14, fontWeight: tab.id === activeTab ? '900' : '700', color: tab.id === activeTab ? colors.ink : colors.pewter }}>
            {tab.icon ? `${tab.icon} ` : ''}{tab.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

// ─── BottomNavBar ───
export interface NavItem {
  id: string;
  icon: string;
  label: string;
  badge?: number;
}

export interface BottomNavBarProps {
  items: NavItem[];
  activeScreen: string;
  onNavigate: (screenId: string) => void;
}

export function BottomNavBar({ items, activeScreen, onNavigate }: BottomNavBarProps) {
  return (
    <View style={{
      flexDirection: 'row',
      backgroundColor: colors.paper,
      borderTopWidth: 1,
      borderTopColor: colors.mist,
      paddingBottom: 20,
      paddingTop: 8,
      paddingHorizontal: 4,
    }}>
      {items.map((item) => {
        const active = item.id === activeScreen;
        return (
          <TouchableOpacity
            key={item.id}
            accessibilityRole="tab"
            accessibilityLabel={item.label}
            accessibilityState={{ selected: active }}
            onPress={() => onNavigate(`NAV_${item.id}`)}
            style={{ flex: 1, alignItems: 'center', gap: 2 }}
          >
            <View>
              <Text style={{ fontSize: 22 }}>{item.icon}</Text>
              {item.badge !== undefined && item.badge > 0 ? (
                <View style={{ position: 'absolute', top: -4, right: -8, minWidth: 18, height: 18, borderRadius: 9, backgroundColor: '#ef4444', justifyContent: 'center', alignItems: 'center' }}>
                  <Text style={{ color: '#fff', fontSize: 11, fontWeight: '900' }}>{item.badge > 9 ? '9+' : item.badge}</Text>
                </View>
              ) : null}
            </View>
            <Text style={{ fontSize: 11, fontWeight: active ? '900' : '600', color: active ? colors.slate : colors.pewter }}>{item.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// ─── MoodPicker ───
export interface MoodPickerProps {
  onSelect: (mood: string) => void;
  selected?: string;
}

const MOODS = [
  { value: 'great', emoji: '😄', label: 'Great', color: '#22c55e' },
  { value: 'good', emoji: '🙂', label: 'Good', color: '#84cc16' },
  { value: 'okay', emoji: '😐', label: 'Okay', color: '#eab308' },
  { value: 'not_great', emoji: '🙁', label: 'Not great', color: '#f97316' },
  { value: 'bad', emoji: '😔', label: 'Difficult', color: '#ef4444' },
];

export function MoodPicker({ onSelect, selected }: MoodPickerProps) {
  return (
    <View style={{ flexDirection: 'row', gap: 8, justifyContent: 'center' }}>
      {MOODS.map((m) => (
        <TouchableOpacity
          key={m.value}
          accessibilityRole="button"
          accessibilityLabel={m.label}
          onPress={() => onSelect(m.value)}
          style={{
            width: 56,
            height: 56,
            borderRadius: 28,
            backgroundColor: selected === m.value ? m.color : colors.paper,
            borderWidth: 2,
            borderColor: selected === m.value ? m.color : colors.mist,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Text style={{ fontSize: 28 }}>{m.emoji}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

// ─── ConsentToggle ───
export interface ConsentToggleProps {
  label: string;
  description: string;
  value: boolean;
  onChange: (v: boolean) => void;
}

export function ConsentToggle({ label, description, value, onChange }: ConsentToggleProps) {
  return (
    <TouchableOpacity
      accessibilityRole="switch"
      accessibilityLabel={label}
      accessibilityState={{ checked: value }}
      onPress={() => onChange(!value)}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: colors.mist,
      }}
    >
      <View style={{ flex: 1, marginRight: 12 }}>
        <Text style={{ fontSize: 16, fontWeight: '800', color: colors.ink }}>{label}</Text>
        <Text style={{ fontSize: 13, fontWeight: '600', color: colors.pewter, marginTop: 2 }}>{description}</Text>
      </View>
      <View style={{
        width: 48,
        height: 28,
        borderRadius: 14,
        backgroundColor: value ? colors.sage : colors.mist,
        justifyContent: 'center',
        paddingHorizontal: 2,
      }}>
        <View style={{
          width: 24,
          height: 24,
          borderRadius: 12,
          backgroundColor: '#FFFFFF',
          alignSelf: value ? 'flex-end' : 'flex-start',
        }} />
      </View>
    </TouchableOpacity>
  );
}
