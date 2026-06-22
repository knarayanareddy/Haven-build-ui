// ─── Vision HomeScreen ───
// TODO(agent-1): Replace with vision-rich UI from havenUIvision/src/components/elder/HomeScreen.tsx
// Features to implement:
//   - Status bar (green/amber/red) with pulse dot
//   - Check-in card (blue gradient) with MoodPicker
//   - 2x2 gradient feature cards (Pills, Today, Shield, Family) with badge counts
//   - Secondary nav row (Buurt, Kompas, Stem, Wacht)
//   - "Are you OK?" button
//   - Personalized greeting with time-of-day

import React from 'react';
import { Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '@haven/ui/src/tokens';
import { pillarGradients } from '@haven/ui/src/visionColors';
import { GradientCard, StatusBadge, MoodPicker } from '@haven/ui/src/visionComponents';
import { havenIcons } from '@haven/ui/src/icons';
import type { ScreenContext } from '../../renderer/ScreenRenderer';

function greeting(now: Date, locale: string, name: string) {
  const h = now.getHours();
  const period = h < 12 ? (locale === 'nl-NL' ? 'Goedemorgen' : 'Good morning')
    : h < 18 ? (locale === 'nl-NL' ? 'Goedemiddag' : 'Good afternoon')
    : (locale === 'nl-NL' ? 'Goedenavond' : 'Good evening');
  return `${period}, ${name}`;
}

export function renderVisionHome(ctx: ScreenContext): React.ReactNode {
  const { locale, profile, medications, messages, scamEvents, tasks } = ctx;
  const pending = medications.filter((m) => m.status !== 'taken').length;
  const unread = messages.filter((m) => m.unread).length;
  const shieldLevel: 'green' | 'amber' | 'red' = scamEvents[0]?.level === 'rood' || scamEvents[0]?.level === 'zwart' ? 'red' : scamEvents[0]?.level === 'amber' ? 'amber' : 'green';
  const statusLabel = shieldLevel === 'green'
    ? (locale === 'nl-NL' ? 'Alles veilig' : 'All safe')
    : shieldLevel === 'amber'
    ? (locale === 'nl-NL' ? 'Let op' : 'Attention')
    : (locale === 'nl-NL' ? 'Actie nodig' : 'Action needed');

  return (
    <View style={{ gap: 14 }}>
      {/* Greeting + Status */}
      <View style={{ borderRadius: 26, padding: 22, backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.mist }}>
        <Text accessibilityRole="header" style={{ fontSize: 34, fontWeight: '900', color: colors.ink, letterSpacing: -0.5 }}>
          {greeting(ctx.now, locale, profile.preferredName)}
        </Text>
        <View style={{ marginTop: 8 }}>
          <StatusBadge status={shieldLevel} label={statusLabel} />
        </View>
      </View>

      {/* Check-in card */}
      <LinearGradient
        colors={['#3b82f6', '#1d4ed8']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ borderRadius: 22, padding: 20 }}
      >
        <Text style={{ fontSize: 20, fontWeight: '900', color: '#FFFFFF' }}>
          {locale === 'nl-NL' ? 'Hoe voelt u zich?' : 'How are you feeling?'}
        </Text>
        <View style={{ marginTop: 12 }}>
          <MoodPicker onSelect={(mood) => ctx.onPrimaryAction(`CHECKIN:morning:${mood === 'great' || mood === 'good' ? '5' : mood === 'okay' ? '3' : '1'}`)} />
        </View>
      </LinearGradient>

      {/* 2x2 Feature Cards */}
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <View style={{ flex: 1 }}>
          <GradientCard
            gradient={pillarGradients.pills}
            icon={havenIcons.pills}
            title={locale === 'nl-NL' ? 'Mijn Pillen' : 'My Pills'}
            subtitle={`${pending} ${locale === 'nl-NL' ? 'te nemen' : 'due'}`}
            badge={pending}
            onPress={() => ctx.onPrimaryAction('NAV_PILLS')}
          />
        </View>
        <View style={{ flex: 1 }}>
          <GradientCard
            gradient={pillarGradients.today}
            icon={havenIcons.calendar}
            title={locale === 'nl-NL' ? 'Vandaag' : 'Today'}
            subtitle={`${tasks.length} ${locale === 'nl-NL' ? 'taken' : 'tasks'}`}
            onPress={() => ctx.onPrimaryAction('NAV_TODAY')}
          />
        </View>
      </View>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <View style={{ flex: 1 }}>
          <GradientCard
            gradient={pillarGradients.shield}
            icon={havenIcons.shield}
            title={locale === 'nl-NL' ? 'Schild' : 'Shield'}
            subtitle={statusLabel}
            onPress={() => ctx.onPrimaryAction('NAV_SHIELD')}
          />
        </View>
        <View style={{ flex: 1 }}>
          <GradientCard
            gradient={pillarGradients.family}
            icon={havenIcons.family}
            title={locale === 'nl-NL' ? 'Familie' : 'Family'}
            subtitle={`${unread} ${locale === 'nl-NL' ? 'nieuw' : 'new'}`}
            badge={unread}
            onPress={() => ctx.onPrimaryAction('NAV_FAMILY')}
          />
        </View>
      </View>

      {/* Secondary nav row */}
      <View style={{ flexDirection: 'row', gap: 8 }}>
        {[
          { id: 'BUURT', icon: havenIcons.neighbourhood, label: locale === 'nl-NL' ? 'Buurt' : 'Neighbourhood' },
          { id: 'KOMPAS', icon: havenIcons.compass, label: locale === 'nl-NL' ? 'Kompas' : 'Compass' },
          { id: 'STEM', icon: havenIcons.microphone, label: locale === 'nl-NL' ? 'Stem' : 'Voice' },
          { id: 'WACHT', icon: havenIcons.hospital, label: locale === 'nl-NL' ? 'Zorg' : 'Care' },
        ].map((item) => (
          <GradientCard
            key={item.id}
            gradient={pillarGradients[item.id.toLowerCase()] ?? pillarGradients.platform}
            icon={item.icon}
            title={item.label}
            onPress={() => ctx.onPrimaryAction(`NAV_${item.id}`)}
            style={{ flex: 1 }}
          />
        ))}
      </View>

      {/* Are you OK? button */}
      <GradientCard
        gradient={['#ef4444', '#dc2626']}
        icon={havenIcons.heart}
        title={locale === 'nl-NL' ? 'Bent u oké?' : 'Are you OK?'}
        subtitle={locale === 'nl-NL' ? 'Druk als u hulp nodig heeft' : 'Press if you need help'}
        onPress={() => ctx.onPrimaryAction('EMERGENCY')}
      />
    </View>
  );
}
