// ─── Vision UI Shared Components ───
// React Native components matching the havenUIvision design language.
// Used across all 3 apps (elder, carer, grandchild/family).

import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { colors, fontFamily, radius, touch, typeScale } from './tokens';
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
          {icon ? <MaterialCommunityIcons name={icon as any} size={28} color="#FFFFFF" /> : null}
          <Text style={{ fontSize: 20, fontWeight: '900', fontFamily: fontFamily.black, color: '#FFFFFF' }}>{title}</Text>
          {subtitle ? <Text style={{ fontSize: typeScale.caption, fontWeight: '700', fontFamily: fontFamily.bold, color: 'rgba(255,255,255,0.85)' }}>{subtitle}</Text> : null}
        </View>
        {badge !== undefined && badge > 0 ? (
          <View style={{ minWidth: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.3)', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 6 }}>
            <Text style={{ color: '#FFFFFF', fontWeight: '900', fontFamily: fontFamily.black, fontSize: typeScale.caption }}>{badge}</Text>
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
      <Text style={{ fontSize: typeScale.caption, fontWeight: '800', fontFamily: fontFamily.bold, color: fg }}>{label}</Text>
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
      {showLabel ? <Text style={{ fontSize: typeScale.caption, fontWeight: '800', fontFamily: fontFamily.bold, color: fg, textAlign: 'right' }}>{Math.round(pct * 100)}%</Text> : null}
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
            minHeight: touch.minimum,
            justifyContent: 'center',
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            {tab.icon ? <MaterialCommunityIcons name={tab.icon as any} size={16} color={tab.id === activeTab ? colors.ink : colors.pewter} /> : null}
            <Text numberOfLines={1} ellipsizeMode="tail" style={{ fontSize: typeScale.caption, fontWeight: tab.id === activeTab ? '900' : '700', fontFamily: tab.id === activeTab ? fontFamily.black : fontFamily.bold, color: tab.id === activeTab ? colors.ink : colors.pewter }}>
              {tab.label}
            </Text>
          </View>
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
              <MaterialCommunityIcons name={item.icon as any} size={24} color={active ? colors.slate : colors.pewter} />
              {item.badge !== undefined && item.badge > 0 ? (
                <View style={{ position: 'absolute', top: -4, right: -8, minWidth: 22, height: 22, borderRadius: 11, backgroundColor: '#ef4444', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 4 }}>
                  <Text style={{ color: '#fff', fontSize: typeScale.badge, fontWeight: '900' }}>{item.badge > 9 ? '9+' : item.badge}</Text>
                </View>
              ) : null}
            </View>
            <Text style={{ fontSize: typeScale.navLabel, fontWeight: active ? '900' : '600', fontFamily: active ? fontFamily.black : fontFamily.regular, color: active ? colors.slate : colors.pewter }}>{item.label}</Text>
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

const MOODS: Array<{ value: string; icon: string; label: string; color: string }> = [
  { value: 'great', icon: 'emoticon-excited-outline', label: 'Great', color: '#22c55e' },
  { value: 'good', icon: 'emoticon-happy-outline', label: 'Good', color: '#84cc16' },
  { value: 'okay', icon: 'emoticon-neutral-outline', label: 'Okay', color: '#eab308' },
  { value: 'not_great', icon: 'emoticon-sad-outline', label: 'Not great', color: '#f97316' },
  { value: 'bad', icon: 'emoticon-cry-outline', label: 'Difficult', color: '#ef4444' },
];

export function MoodPicker({ onSelect, selected }: MoodPickerProps) {
  return (
    <View style={{ flexDirection: 'row', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
      {MOODS.map((m) => (
        <TouchableOpacity
          key={m.value}
          accessibilityRole="button"
          accessibilityLabel={m.label}
          onPress={() => onSelect(m.value)}
          style={{
            width: touch.minimum,
            height: touch.minimum,
            borderRadius: 36,
            backgroundColor: selected === m.value ? m.color : colors.paper,
            borderWidth: 2,
            borderColor: selected === m.value ? m.color : colors.mist,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <MaterialCommunityIcons name={m.icon as any} size={28} color={selected === m.value ? '#FFFFFF' : m.color} />
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
        minHeight: touch.minimum,
      }}
    >
      <View style={{ flex: 1, marginRight: 12 }}>
        <Text style={{ fontSize: typeScale.caption, fontWeight: '800', fontFamily: fontFamily.bold, color: colors.ink }}>{label}</Text>
        <Text style={{ fontSize: typeScale.caption, fontWeight: '600', fontFamily: fontFamily.regular, color: colors.pewter, marginTop: 2 }}>{description}</Text>
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
