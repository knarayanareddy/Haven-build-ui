// ─── Vision MoreScreen ───
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { colors, typeScale } from '@haven/ui/src/tokens';
import { GradientCard } from '@haven/ui/src/visionComponents';
import { pillarGradients } from '@haven/ui/src/visionColors';
import { productionScreens } from '@haven/schema/src/screenSchema';
import type { ScreenContext } from '../../renderer/ScreenRenderer';

const secondaryIcons: Record<string, string> = {
  BUURT: '🏘️',
  KOMPAS: '🧭',
  STEM: '🎙️',
  WACHT: '🏥',
  SETTINGS: '⚙️',
};

export function renderVisionMore(ctx: ScreenContext): React.ReactNode {
  const { locale } = ctx;
  const secondary = productionScreens.filter(
    (s) => !s.isPrimary && s.screenId !== 'ONBOARDING' && s.screenId !== 'INCOMING_CALL' && s.screenId !== 'MORE'
  );

  return (
    <View style={{ gap: 14 }}>
      <Text style={{ fontSize: typeScale.caption, color: colors.pewter, fontWeight: '700' }}>
        {locale === 'nl-NL' ? 'Aanvullende functies van HAVEN' : 'Additional HAVEN features'}
      </Text>
      <View style={{ gap: 10 }}>
        {secondary.map((screen) => {
          const gradientKey = screen.screenId.toLowerCase();
          const gradient = pillarGradients[gradientKey] ?? pillarGradients.platform;
          return (
            <GradientCard
              key={screen.screenId}
              gradient={gradient}
              icon={secondaryIcons[screen.screenId] ?? '📌'}
              title={locale === 'nl-NL' ? screen.titleNl : screen.titleEn}
              subtitle={locale === 'nl-NL' ? screen.helpTextNl : screen.helpTextEn}
              onPress={() => ctx.onPrimaryAction(`NAV_${screen.screenId}`)}
            />
          );
        })}
      </View>
    </View>
  );
}
