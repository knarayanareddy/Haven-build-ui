// ─── Shared Language Toggle Component ───
// Drop-in toggle for switching between Dutch and English across all HAVEN apps.
// Uses the I18nProvider context to persist locale change in-session.
import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { useTranslation } from './index';
import type { Locale } from '@haven/contracts/src/haven';

interface LanguageToggleProps {
  style?: object;
}

export function LanguageToggle({ style }: LanguageToggleProps) {
  const { locale, setLocale } = useTranslation();

  const options: { key: Locale; label: string; flag: string }[] = [
    { key: 'nl-NL', label: 'NL', flag: '🇳🇱' },
    { key: 'en-GB', label: 'EN', flag: '🇬🇧' },
  ];

  return (
    <View style={[styles.container, style]}>
      {options.map((opt) => (
        <TouchableOpacity
          key={opt.key}
          onPress={() => setLocale(opt.key)}
          accessibilityLabel={opt.key === 'nl-NL' ? 'Nederlands' : 'English'}
          accessibilityRole="button"
          style={[
            styles.pill,
            locale === opt.key && styles.pillActive,
          ]}
        >
          <Text style={[styles.pillText, locale === opt.key && styles.pillTextActive]}>
            {opt.flag} {opt.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  pillActive: {
    backgroundColor: '#1E3A5F',
    borderColor: '#1E3A5F',
  },
  pillText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6B7280',
  },
  pillTextActive: {
    color: '#FFFFFF',
  },
});
