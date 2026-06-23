// ─── Vision Carer: Handover Tab ───
// Wired to Supabase: calls fn-carer-handover-note, offline queue fallback
import React, { useState } from 'react';
import { Alert, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { colors, semanticColors } from '@haven/ui/src/tokens';
import { useAuth } from '../../auth/AuthProvider';
import { useCarerClient } from '../../hooks/useCarerClient';
import { enqueueOffline } from '../../services/offlineQueue';

interface HandoverTabProps {
  elderName: string;
  isOnline: boolean;
  locale: string;
}

function getFields(nl: boolean) {
  return [
    { field: 'appetite', label: nl ? 'Eetlust' : 'Appetite', placeholder: nl ? 'Bijv. Goed ontbijt gegeten, lunch half opgelaten...' : 'E.g. Good breakfast, half of lunch left...' },
    { field: 'mood', label: nl ? 'Stemming' : 'Mood', placeholder: nl ? 'Bijv. Rustig, goed gehumeuerd, praatgraag...' : 'E.g. Calm, good-humored, talkative...' },
    { field: 'mobility', label: nl ? 'Mobiliteit' : 'Mobility', placeholder: nl ? 'Bijv. Normaal looppatroon, geen klachten...' : 'E.g. Normal walking pattern, no complaints...' },
    { field: 'concerns', label: nl ? 'Aandachtspunten' : 'Concerns', placeholder: nl ? 'Bijv. Lichte hoest, vloer kleedje verwijderd...' : 'E.g. Slight cough, rug removed...' },
    { field: 'administered', label: nl ? 'Toegediende medicatie' : 'Administered medication', placeholder: nl ? 'Bijv. Metformin 500mg om 08:15 met water...' : 'E.g. Metformin 500mg at 08:15 with water...' },
  ] as const;
}

function getRecipients(nl: boolean) {
  return [
    { id: 'family', label: nl ? '👨‍👩‍👧 Familie' : '👨‍👩‍👧 Family' },
    { id: 'colleague', label: nl ? 'Collega' : 'Colleague' },
    { id: 'care-team', label: nl ? '🏥 Zorgteam' : '🏥 Care team' },
  ];
}

export function HandoverTab({ elderName, isOnline, locale }: HandoverTabProps) {
  const nl = locale.startsWith('nl');
  const { session } = useAuth();
  const carerClient = useCarerClient();
  const [form, setForm] = useState<Record<string, string>>({ appetite: '', mood: '', mobility: '', concerns: '', administered: '' });
  const [recipients, setRecipients] = useState<string[]>(['family']);
  const [saved, setSaved] = useState(false);
  const FIELDS = getFields(nl);
  const RECIPIENTS = getRecipients(nl);

  function updateField(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function toggleRecipient(id: string) {
    setRecipients((prev) => prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]);
  }

  const [submitting, setSubmitting] = useState(false);

  async function handleSave() {
    const elderId = process.env.EXPO_PUBLIC_CARER_ELDER_IDS?.split(',')[0] ?? '00000000-0000-0000-0000-000000000001';

    // Offline path: queue for later sync
    if (!isOnline || !session) {
      enqueueOffline('handover_note', { elder_id: elderId, ...form, recipients });
      setSaved(true);
      Alert.alert('HAVEN', nl ? 'Lokaal opgeslagen — synchroniseert zodra online.' : 'Saved locally — will sync when online.');
      setTimeout(() => setSaved(false), 3000);
      return;
    }

    // Online path: call fn-carer-handover-note
    setSubmitting(true);
    try {
      const result = await carerClient!.handoverNote({
        elder_id: elderId,
        appetite: form.appetite ? 3 : 1,
        mood: form.mood ? 3 : 1,
        mobility: form.mobility || undefined,
        concerns_nl: form.concerns || undefined,
        notes_nl: [form.appetite, form.mood, form.mobility, form.administered].filter(Boolean).join(' | ') || undefined,
        administered_medication_id: undefined,
        family_recipient_ids: recipients.includes('family') ? [] : undefined,
      });

      setSaved(true);
      const interactionWarning = result.interaction_warning;
      Alert.alert('HAVEN',
        (nl ? 'Handover opgeslagen en verzonden!' : 'Handover saved and sent!') +
        (interactionWarning ? `\n\n${interactionWarning}` : '')
      );
      setForm({ appetite: '', mood: '', mobility: '', concerns: '', administered: '' });
      setRecipients(['family']);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      // Network failure: queue offline
      enqueueOffline('handover_note', { elder_id: elderId, ...form, recipients });
      Alert.alert('HAVEN', nl
        ? 'Verzenden mislukt — lokaal opgeslagen voor later.'
        : 'Send failed — saved locally for later.');
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } finally {
      setSubmitting(false);
    }
  }

  function handleCancel() {
    setForm({ appetite: '', mood: '', mobility: '', concerns: '', administered: '' });
    setRecipients(['family']);
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.linen }} contentContainerStyle={{ padding: 16, gap: 12 }}>
      {/* BSN warning banner */}
      <View style={{ backgroundColor: '#FFF1F2', borderWidth: 1, borderColor: '#FECDD3', borderRadius: 16, padding: 12, gap: 4 }}>
        <Text style={{ fontSize: 13, fontWeight: '800', fontFamily: 'Nunito-Bold', color: '#9F1239' }}>📝 {nl ? 'Handover-notitie (WACHT)' : 'Handover note (WACHT)'}</Text>
        <Text style={{ fontSize: 12, color: '#BE123C', fontWeight: '600', fontFamily: 'Nunito-SemiBold' }}>
          {nl ? 'Schrijf een korte, niet-klinische overdracht voor familie en collega\'s. BSN en gevoelige gegevens worden automatisch geweigerd.' : 'Write a brief, non-clinical handover for family and colleagues. BSN and sensitive data are automatically rejected.'}
        </Text>
      </View>

      {/* Success banner */}
      {saved && (
        <View style={{ backgroundColor: semanticColors.successBg, borderWidth: 1, borderColor: semanticColors.successBorder, borderRadius: 14, padding: 12 }}>
          <Text style={{ fontSize: 14, fontWeight: '800', fontFamily: 'Nunito-Bold', color: semanticColors.successText }}>
            ✓ {isOnline
              ? (nl ? 'Handover opgeslagen en verzonden!' : 'Handover saved and sent!')
              : (nl ? 'Lokaal opgeslagen — synchroniseert zodra online.' : 'Saved locally — will sync when online.')}
          </Text>
        </View>
      )}

      {/* Form fields */}
      {FIELDS.map(({ field, label, placeholder }) => (
        <View key={field} style={{ gap: 4 }}>
          <Text style={{ fontSize: 13, fontWeight: '800', fontFamily: 'Nunito-Bold', color: colors.ink }}>{label}</Text>
          <TextInput
            value={form[field]}
            onChangeText={(v: string) => updateField(field, v)}
            placeholder={placeholder}
            placeholderTextColor={colors.pewter}
            multiline
            numberOfLines={2}
            style={{
              borderRadius: 14, padding: 12, backgroundColor: colors.paper,
              borderWidth: 1, borderColor: colors.mist, fontSize: 14, color: colors.ink,
              minHeight: 56, textAlignVertical: 'top',
            }}
          />
        </View>
      ))}

      {/* Recipients */}
      <View style={{ gap: 6 }}>
        <Text style={{ fontSize: 13, fontWeight: '800', fontFamily: 'Nunito-Bold', color: colors.ink }}>{nl ? 'Ontvangers' : 'Recipients'}</Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {RECIPIENTS.map((r) => (
            <TouchableOpacity
              key={r.id}
              onPress={() => toggleRecipient(r.id)}
              style={{
                flex: 1, paddingVertical: 10, borderRadius: 14, alignItems: 'center',
                backgroundColor: recipients.includes(r.id) ? semanticColors.danger : colors.mist,
              }}
            >
              <Text style={{ fontSize: 12, fontWeight: '800', fontFamily: 'Nunito-Bold', color: recipients.includes(r.id) ? '#fff' : colors.graphite }}>
                {r.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Action buttons */}
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <TouchableOpacity
          onPress={handleCancel}
          style={{ flex: 1, paddingVertical: 12, borderRadius: 14, alignItems: 'center', backgroundColor: colors.mist }}
        >
          <Text style={{ fontSize: 14, fontWeight: '800', fontFamily: 'Nunito-Bold', color: colors.graphite }}>{nl ? 'Annuleren' : 'Cancel'}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleSave}
          disabled={submitting}
          style={{ flex: 1, paddingVertical: 12, borderRadius: 14, alignItems: 'center', backgroundColor: semanticColors.danger, opacity: submitting ? 0.6 : 1 }}
        >
          <Text style={{ fontSize: 14, fontWeight: '800', fontFamily: 'Nunito-Bold', color: '#fff' }}>
            {submitting ? (nl ? 'Bezig...' : 'Sending...') : isOnline ? (nl ? '📤 Verzenden' : '📤 Send') : (nl ? '💾 Lokaal opslaan' : '💾 Save locally')}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
