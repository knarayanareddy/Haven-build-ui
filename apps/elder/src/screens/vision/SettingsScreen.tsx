// ─── Vision SettingsScreen ───
import React, { useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { colors } from '@haven/ui/src/tokens';
import { ConsentToggle } from '@haven/ui/src/visionComponents';
// DEMO: mock consent/device — consent toggles should read/write live consent_records
import { CONSENT_SETTINGS, FAMILIAR_VOICE_STATUS, DEVICE_HEALTH } from '@haven/ui/src/mockData';
import type { ScreenContext } from '../../renderer/ScreenRenderer';

export function renderVisionSettings(ctx: ScreenContext): React.ReactNode {
  return <VisionSettingsInner ctx={ctx} />;
}

function VisionSettingsInner({ ctx }: { ctx: ScreenContext }) {
  const { locale } = ctx;
  const [consent, setConsent] = useState(CONSENT_SETTINGS);

  function toggleConsent(key: keyof typeof CONSENT_SETTINGS) {
    setConsent((prev) => ({ ...prev, [key]: !prev[key] }));
    ctx.onPrimaryAction(`CONSENT_TOGGLE:${key}`);
  }

  return (
    <View style={{ gap: 18 }}>
      {/* Display settings */}
      <Text style={{ fontSize: 20, fontWeight: '900', color: colors.ink }}>
        {locale === 'nl-NL' ? 'Weergave' : 'Display'}
      </Text>
      <View style={{ borderRadius: 22, padding: 18, backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.mist }}>
        <ConsentToggle
          label={locale === 'nl-NL' ? 'Taal / Language' : 'Language'}
          description={locale === 'nl-NL' ? 'Engels ↔ Nederlands' : 'English ↔ Dutch'}
          value={locale === 'en-GB'}
          onChange={() => ctx.onPrimaryAction('TOGGLE_LANG')}
        />
        <ConsentToggle
          label={locale === 'nl-NL' ? 'Hoog contrast' : 'High contrast'}
          description={locale === 'nl-NL' ? 'Grotere contrasten voor betere zichtbaarheid' : 'Higher contrast for better visibility'}
          value={ctx.profile.highContrast ?? false}
          onChange={() => ctx.onPrimaryAction('TOGGLE_CONTRAST')}
        />
        <ConsentToggle
          label={locale === 'nl-NL' ? 'Groter lettertype' : 'Larger text'}
          description={locale === 'nl-NL' ? 'Vergroot alle tekst' : 'Enlarge all text'}
          value={(ctx.profile.fontSizeMultiplier ?? 1) > 1}
          onChange={() => ctx.onPrimaryAction('TOGGLE_FONTSIZE')}
        />
      </View>

      {/* Privacy & Consent */}
      <Text style={{ fontSize: 20, fontWeight: '900', color: colors.ink }}>
        {locale === 'nl-NL' ? 'Privacy & Toestemming' : 'Privacy & Consent'}
      </Text>
      <View style={{ borderRadius: 22, padding: 18, backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.mist }}>
        <ConsentToggle
          label={locale === 'nl-NL' ? 'Medicijnoverzicht' : 'Medication overview'}
          description={locale === 'nl-NL' ? 'Familie kan uw medicijnen zien' : 'Family can view your medications'}
          value={consent.medicationView}
          onChange={() => toggleConsent('medicationView')}
        />
        <ConsentToggle
          label={locale === 'nl-NL' ? 'Locatie delen' : 'Location sharing'}
          description={locale === 'nl-NL' ? 'Familie kan uw veilige zone zien' : 'Family can see your safe zone'}
          value={consent.locationView}
          onChange={() => toggleConsent('locationView')}
        />
        <ConsentToggle
          label={locale === 'nl-NL' ? 'Stem geheugen' : 'Voice memory'}
          description={locale === 'nl-NL' ? 'HAVEN onthoudt uw gesprekken' : 'HAVEN remembers your conversations'}
          value={consent.companionMemory}
          onChange={() => toggleConsent('companionMemory')}
        />
        <ConsentToggle
          label={locale === 'nl-NL' ? 'Buurt identiteit' : 'Neighbourhood identity'}
          description={locale === 'nl-NL' ? 'Deel uw naam met buurtmatches' : 'Share your name with neighbourhood matches'}
          value={consent.buurtIdentity}
          onChange={() => toggleConsent('buurtIdentity')}
        />
        <ConsentToggle
          label={locale === 'nl-NL' ? 'Weekdigest' : 'Weekly digest'}
          description={locale === 'nl-NL' ? 'Wekelijks overzicht naar familie' : 'Weekly summary sent to family'}
          value={consent.weeklyDigest}
          onChange={() => toggleConsent('weeklyDigest')}
        />
        <ConsentToggle
          label={locale === 'nl-NL' ? 'Stemopname' : 'Voice recording'}
          description={locale === 'nl-NL' ? 'HAVEN neemt stem op voor herkenning' : 'HAVEN records voice for recognition'}
          value={consent.voiceRecording}
          onChange={() => toggleConsent('voiceRecording')}
        />
      </View>

      {/* Familiar voice */}
      <Text style={{ fontSize: 20, fontWeight: '900', color: colors.ink }}>
        {locale === 'nl-NL' ? 'Vertrouwde stem' : 'Familiar voice'}
      </Text>
      <View style={{ borderRadius: 22, padding: 18, backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.mist, gap: 10 }}>
        <Text style={{ fontSize: 15, color: colors.graphite, fontWeight: '700' }}>
          {locale === 'nl-NL'
            ? 'Laat HAVEN klinken als een vertrouwd familielid. Neem 5 zinnen op.'
            : 'Make HAVEN sound like a trusted family member. Record 5 sentences.'}
        </Text>
        {FAMILIAR_VOICE_STATUS.recorded ? (
          <View style={{ backgroundColor: colors.sagePale, borderRadius: 14, padding: 10 }}>
            <Text style={{ fontSize: 14, fontWeight: '800', color: colors.sage }}>
              {locale === 'nl-NL' ? '✓ Stemmodel getraind' : '✓ Voice model trained'}
            </Text>
          </View>
        ) : (
          <TouchableOpacity
            onPress={() => ctx.onPrimaryAction('SETUP_FAMILIAR_VOICE')}
            style={{ backgroundColor: colors.slate, borderRadius: 16, paddingVertical: 14, alignItems: 'center' }}
          >
            <Text style={{ color: '#fff', fontSize: 16, fontWeight: '900' }}>
              🎙️ {locale === 'nl-NL' ? 'Start opname' : 'Start recording'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Device health */}
      <Text style={{ fontSize: 20, fontWeight: '900', color: colors.ink }}>
        {locale === 'nl-NL' ? 'Apparaatstatus' : 'Device status'}
      </Text>
      <View style={{ borderRadius: 22, padding: 18, backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.mist, gap: 8 }}>
        {[
          { label: locale === 'nl-NL' ? 'Batterij' : 'Battery', value: `${DEVICE_HEALTH.batteryLevel}%`, emoji: '🔋' },
          { label: locale === 'nl-NL' ? 'Netwerk' : 'Network', value: DEVICE_HEALTH.networkStatus, emoji: '📶' },
          { label: locale === 'nl-NL' ? 'Versie' : 'Version', value: DEVICE_HEALTH.appVersion, emoji: '📱' },
          { label: locale === 'nl-NL' ? 'Laatst gezien' : 'Last seen', value: DEVICE_HEALTH.lastSeen instanceof Date ? DEVICE_HEALTH.lastSeen.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' }) : 'now', emoji: '⏱️' },
        ].map((item) => (
          <View key={item.label} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 4 }}>
            <Text style={{ fontSize: 18 }}>{item.emoji}</Text>
            <Text style={{ fontSize: 15, fontWeight: '800', color: colors.ink, flex: 1 }}>{item.label}</Text>
            <Text style={{ fontSize: 15, fontWeight: '700', color: colors.graphite }}>{item.value}</Text>
          </View>
        ))}
      </View>

      {/* Data rights */}
      <View style={{ borderRadius: 18, padding: 14, backgroundColor: colors.slatePale, gap: 6 }}>
        <Text style={{ fontSize: 14, fontWeight: '900', color: colors.slate }}>
          {locale === 'nl-NL' ? 'Uw gegevensrechten (AVG)' : 'Your data rights (GDPR)'}
        </Text>
        <Text style={{ fontSize: 13, color: colors.graphite, fontWeight: '600' }}>
          {locale === 'nl-NL'
            ? 'U kunt op elk moment uw gegevens exporteren, corrigeren of laten verwijderen.'
            : 'You can export, correct, or delete your data at any time.'}
        </Text>
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
          <TouchableOpacity onPress={() => ctx.onPrimaryAction('DATA_EXPORT')} style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, backgroundColor: colors.paper }}>
            <Text style={{ fontSize: 13, fontWeight: '800', color: colors.slate }}>{locale === 'nl-NL' ? 'Exporteer' : 'Export'}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => ctx.onPrimaryAction('DATA_DELETE')} style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, backgroundColor: colors.rosePale }}>
            <Text style={{ fontSize: 13, fontWeight: '800', color: colors.rose }}>{locale === 'nl-NL' ? 'Verwijder alles' : 'Delete all'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Sign out */}
      <TouchableOpacity
        onPress={() => ctx.onPrimaryAction('SIGN_OUT')}
        style={{ borderRadius: 16, paddingVertical: 14, alignItems: 'center', borderWidth: 1, borderColor: colors.mist }}
      >
        <Text style={{ color: colors.rose, fontSize: 16, fontWeight: '900' }}>
          {locale === 'nl-NL' ? 'Uitloggen' : 'Sign out'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}
