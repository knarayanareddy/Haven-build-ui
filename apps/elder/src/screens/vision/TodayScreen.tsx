// ─── Vision TodayScreen ───
// Translates havenUIvision/src/components/elder/TodayScreen.tsx to React Native

import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { colors } from '@haven/ui/src/tokens';
import { ProgressBar } from '@haven/ui/src/visionComponents';
import { VITALS } from '@haven/ui/src/mockData';
import type { ScreenContext } from '../../renderer/ScreenRenderer';

export function renderVisionToday(ctx: ScreenContext): React.ReactNode {
  const { locale, tasks, medications } = ctx;
  const done = tasks.filter((t) => t.done).length;
  const progress = tasks.length > 0 ? done / tasks.length : 0;
  const dateStr = ctx.now.toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <View style={{ gap: 14 }}>
      {/* Date header */}
      <Text style={{ fontSize: 16, fontWeight: '700', color: colors.pewter, textTransform: 'capitalize' }}>{dateStr}</Text>

      {/* Progress card */}
      <View style={{ borderRadius: 22, padding: 20, backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.mist, gap: 10 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ fontSize: 20, fontWeight: '900', color: colors.ink }}>
            {locale === 'nl-NL' ? 'Voortgang' : 'Progress'}
          </Text>
          <Text style={{ fontSize: 16, fontWeight: '800', color: colors.sage }}>
            {done}/{tasks.length}
          </Text>
        </View>
        <ProgressBar progress={progress} color={colors.sage} height={12} showLabel />
      </View>

      {/* Task list */}
      <View style={{ borderRadius: 22, backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.mist, padding: 14, gap: 2 }}>
        {tasks.map((task) => {
          const titleRendered = (locale === 'nl-NL' ? task.title : task.titleEn ?? task.title) ?? task.title;
          return (
            <TouchableOpacity
              key={task.id}
              accessibilityRole="button"
              accessibilityLabel={`${titleRendered} ${task.done ? (locale === 'nl-NL' ? 'voltooid' : 'done') : (locale === 'nl-NL' ? 'te doen' : 'to do')}`}
              onPress={() => ctx.onPrimaryAction(`TOGGLE_TASK:${task.id}`)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                paddingVertical: 12,
                borderBottomWidth: 1,
                borderBottomColor: colors.mist,
                opacity: task.done ? 0.5 : 1,
              }}
            >
              <View style={{
                width: 36, height: 36, borderRadius: 18,
                backgroundColor: task.done ? colors.sagePale : colors.slatePale,
                justifyContent: 'center', alignItems: 'center',
              }}>
                <Text style={{ fontSize: 18 }}>{task.done ? '✓' : task.icon}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{
                  fontSize: 18, fontWeight: '800', color: colors.ink,
                  textDecorationLine: task.done ? 'line-through' : 'none',
                }}>{titleRendered}</Text>
                <Text style={{ fontSize: 14, color: colors.pewter, fontWeight: '700' }}>{task.subtitle}</Text>
              </View>
              {!task.done && (
                <Text style={{ fontSize: 13, fontWeight: '800', color: colors.sage }}>
                  {locale === 'nl-NL' ? 'Tik gereed' : 'Tap done'}
                </Text>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Vitals grid */}
      <Text style={{ fontSize: 20, fontWeight: '900', color: colors.ink }}>
        {locale === 'nl-NL' ? 'Vitale waarden' : 'Vitals'}
      </Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
        {VITALS.map((vital) => (
          <View key={vital.label} style={{
            flex: 1, minWidth: '45%',
            borderRadius: 18, padding: 16,
            backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.mist,
            gap: 4,
          }}>
            <Text style={{ fontSize: 20 }}>{vital.emoji}</Text>
            <Text style={{ fontSize: 22, fontWeight: '900', color: colors.ink }}>{vital.value}</Text>
            <Text style={{ fontSize: 13, fontWeight: '700', color: colors.pewter }}>{vital.label}</Text>
            <Text style={{ fontSize: 12, fontWeight: '700', color: vital.status === 'low' ? colors.amber : colors.sage }}>
              {vital.trend === 'up' ? '↑' : vital.trend === 'down' ? '↓' : '→'} {vital.unit}
            </Text>
          </View>
        ))}
      </View>

      {/* Medication count */}
      <Text style={{ fontSize: 16, color: colors.graphite, fontWeight: '700' }}>
        {medications.length} {locale === 'nl-NL' ? 'medicijnen vandaag' : 'medications today'}
      </Text>
    </View>
  );
}
