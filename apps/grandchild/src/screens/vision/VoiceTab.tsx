// ─── Vision Family Dashboard: Familiar Voice Tab ───
import React, { useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { colors } from '@haven/ui/src/tokens';
import { FAMILIAR_VOICE_STATUS } from '@haven/ui/src/mockData';

interface VoiceTabProps {
  locale: string;
}

export function VoiceTab({ locale }: VoiceTabProps) {
  const nl = locale.startsWith('nl');
  const [recording, setRecording] = useState(false);
  const [recorded, setRecorded] = useState(false);

  function handleRecord() {
    setRecording(true);
    setTimeout(() => { setRecording(false); setRecorded(true); }, 3000);
  }

  function handleRecordAgain() {
    setRecorded(false);
  }

  const privacyItems = nl ? [
    'Uw stem wordt verwerkt via VAPI voice AI (EU DPA in behandeling)',
    'Opname wordt alleen gebruikt voor spraaksynthese voor Margaret',
    'U kunt uw opname op elk moment verwijderen',
    'Margaret moet toestemming geven voordat deze functie wordt geactiveerd',
    'Deze functie is momenteel in beta',
  ] : [
    'Your voice is processed via VAPI voice AI (EU DPA in progress)',
    'Recording is used only for voice synthesis for Margaret',
    'You can delete your recording at any time',
    'Margaret must consent before this feature activates',
    'This feature is currently in beta',
  ];

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.linen }} contentContainerStyle={{ padding: 16, gap: 14 }}>
      {/* Info banner */}
      <View style={{ backgroundColor: '#FEF3C7', borderWidth: 1, borderColor: '#FDE68A', borderRadius: 20, padding: 16, gap: 6 }}>
        <Text style={{ fontSize: 15, fontWeight: '900', color: '#78350F' }}>🎙️ {nl ? 'Vertrouwde Stem' : 'Familiar Voice'}</Text>
        <Text style={{ fontSize: 13, color: '#92400E', fontWeight: '600' }}>
          {nl
            ? 'Neem uw stem op zodat HAVEN met Margaret kan spreken met uw stem. Dit is optioneel en afgeschermd door toestemming van de oudere. Uw opname is versleuteld en wordt alleen gebruikt voor spraaksynthese.'
            : 'Record your voice so HAVEN can speak to Margaret using your voice. This is optional and gated by elder consent. Your recording is encrypted and used only for TTS synthesis.'}
        </Text>
      </View>

      {/* Privacy disclosure */}
      <View style={{ borderRadius: 18, padding: 16, backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.mist, gap: 8 }}>
        <Text style={{ fontSize: 15, fontWeight: '900', color: colors.ink }}>{nl ? 'Privacyverklaring' : 'Privacy disclosure'}</Text>
        {privacyItems.map((item, i) => (
          <View key={i} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
            <Text style={{ color: '#3B82F6', fontSize: 12, marginTop: 2 }}>ℹ</Text>
            <Text style={{ fontSize: 13, color: colors.graphite, fontWeight: '600', flex: 1 }}>{item}</Text>
          </View>
        ))}
      </View>

      {/* Sample sentences */}
      <View style={{ borderRadius: 18, padding: 16, backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.mist, gap: 8 }}>
        <Text style={{ fontSize: 15, fontWeight: '900', color: colors.ink }}>
          {nl ? 'Voorbeeldzinnen om op te nemen' : 'Sample sentences to record'}
        </Text>
        {FAMILIAR_VOICE_STATUS.sampleSentences.map((sentence, i) => (
          <View key={i} style={{
            backgroundColor: colors.mist, borderRadius: 14, padding: 12,
            borderWidth: 1, borderColor: colors.mist,
          }}>
            <Text style={{ fontSize: 14, color: colors.ink, fontStyle: 'italic', fontWeight: '600' }}>"{sentence}"</Text>
          </View>
        ))}
      </View>

      {/* Record button */}
      <View style={{ alignItems: 'center', gap: 12, paddingVertical: 8 }}>
        {!recorded ? (
          <TouchableOpacity
            onPress={handleRecord}
            disabled={recording}
            style={{
              width: 96, height: 96, borderRadius: 48, justifyContent: 'center', alignItems: 'center',
              backgroundColor: recording ? '#EF4444' : colors.paper,
              borderWidth: recording ? 0 : 4, borderColor: '#F59E0B',
              shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 8, elevation: 4,
            }}
          >
            <Text style={{ fontSize: 32 }}>{recording ? '⏹' : '🎤'}</Text>
            <Text style={{ fontSize: 11, fontWeight: '800', color: recording ? '#fff' : colors.graphite, marginTop: 2 }}>
              {recording ? (nl ? 'Opnemen...' : 'Recording...') : (nl ? 'Opnemen' : 'Record')}
            </Text>
          </TouchableOpacity>
        ) : (
          <View style={{ alignItems: 'center', gap: 8 }}>
            <Text style={{ fontSize: 40 }}>✅</Text>
            <Text style={{ fontSize: 16, fontWeight: '900', color: '#065F46' }}>
              {nl ? 'Opname voltooid!' : 'Recording complete!'}
            </Text>
            <Text style={{ fontSize: 13, color: colors.pewter, fontWeight: '600' }}>
              {nl ? 'Wacht op toestemming van Margaret om te activeren' : 'Awaiting Margaret\'s consent to activate'}
            </Text>
            <TouchableOpacity
              onPress={handleRecordAgain}
              style={{ paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12, backgroundColor: colors.mist }}
            >
              <Text style={{ fontSize: 13, fontWeight: '700', color: colors.ink }}>
                {nl ? 'Opnieuw opnemen' : 'Record again'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </ScrollView>
  );
}
