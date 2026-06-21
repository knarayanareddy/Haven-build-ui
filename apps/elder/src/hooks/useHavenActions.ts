import { useCallback } from 'react';
import { Alert, Linking } from 'react-native';
import { useTranslation } from '@haven/i18n';
import { useAuth } from '../auth/AuthProvider';
import { HavenClient } from '../services/havenClient';
import { enqueueOfflineAction } from '../services/sqliteOfflineQueue';
import { classifyNetworkError } from '../state/networkResilience';
import { translateElderError } from '../services/errorMapper';

function sessionUserId(session: { access_token?: string } | null): string | null {
  const directUser = (session as unknown as { user?: { id?: string } } | null)?.user?.id;
  if (directUser) return directUser;
  const token = session?.access_token;
  if (!token) return null;
  try {
    const [, payload] = token.split('.');
    return JSON.parse(atob(payload))?.sub ?? null;
  } catch {
    return null;
  }
}

export function useHavenActions(screenId: string) {
  const { session } = useAuth();
  const { locale, setLocale, t } = useTranslation();
  const client = session ? new HavenClient({ supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL!, accessToken: session.access_token }) : null;
  const elderId = sessionUserId(session);

  const handlePrimaryAction = useCallback(async (actionId: string) => {
    if (actionId === 'EMERGENCY') {
      Alert.alert(
        'HAVEN',
        t('actions.emergency.alert'),
        [
          {
            text: 'Bel 112',
            onPress: () => Linking.openURL('tel:112').catch(() => undefined),
            style: 'destructive',
          },
          { text: 'Annuleren', style: 'cancel' },
        ],
      );
      return;
    }
    if (actionId === 'CALL_FAMILY') {
      Alert.alert('HAVEN', t('actions.call_family.alert'));
      return;
    }
    if (actionId === 'LANG_TOGGLE' || actionId === 'TOGGLE_LANG') {
      const next = locale === 'nl-NL' ? 'en-GB' : 'nl-NL';
      setLocale(next);
      Alert.alert('HAVEN', next === 'nl-NL' ? 'Taal ingesteld op Nederlands.' : 'Language set to English.');
      return;
    }
    if (actionId === 'CONTRAST_TOGGLE') {
      Alert.alert('HAVEN', t('actions.contrast_toggle.alert'));
      return;
    }
    if (actionId === 'FONT_BIGGER') {
      Alert.alert('HAVEN', t('actions.font_bigger.alert'));
      return;
    }
    if (actionId === 'TELL_PILLS') {
      Alert.alert('HAVEN', t('actions.tell_pills.alert'));
      return;
    }
    if (actionId === 'REVIEW_ALERTS') {
      Alert.alert('HAVEN', t('actions.review_alerts.alert'));
      return;
    }
    if (actionId === 'SEND_HEART' || actionId === 'SEND_OK') {
      const kind = actionId === 'SEND_HEART' ? 'heart' : 'ok';
      try {
        enqueueOfflineAction('SEND_MESSAGE', { message_type: kind, content_nl: kind === 'heart' ? '❤️' : '👍' });
      } catch (_) {
        // SQLite/crypto may not be available
      }
      if (client && elderId) {
        try {
          await fetch(`${process.env.EXPO_PUBLIC_SUPABASE_URL}/rest/v1/family_messages`, {
            method: 'POST',
            headers: {
              authorization: `Bearer ${session?.access_token}`,
              apikey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? session?.access_token ?? '',
              'content-type': 'application/json',
              prefer: 'return=minimal',
            },
            body: JSON.stringify({
              elder_id: elderId,
              sender_id: elderId,
              sender_role: 'elder',
              message_type: kind,
              content_nl: kind === 'heart' ? '❤️' : '👍',
              content_en: kind === 'heart' ? '❤️' : '👍',
            }),
          });
        } catch (_) {
          // Queued offline, will sync later
        }
      }
      Alert.alert('HAVEN', kind === 'heart' ? t('actions.send_heart.alert') : t('actions.send_ok.alert'));
      return;
    }
    if (actionId === 'RECORD_STORY') {
      Alert.alert('HAVEN', t('actions.record_story.alert'));
      return;
    }
    if (actionId === 'BUURT_MATCH' || actionId === 'BUURT_INTRO') {
      Alert.alert('HAVEN', t('actions.buurt_privacy.alert'));
      return;
    }
    if (actionId === 'OPT_IN_BUURT') {
      Alert.alert('HAVEN', t('actions.opt_in_buurt.alert'));
      return;
    }
    if (actionId === 'CRISIS') {
      Alert.alert('HAVEN', t('actions.crisis.alert'));
      return;
    }
    if (actionId === 'TALK') {
      Alert.alert('HAVEN', t('actions.talk.alert'));
      return;
    }
    if (actionId === 'SCAN_DOC') {
      Alert.alert('HAVEN', t('actions.scan_doc.alert'));
      return;
    }
    if (actionId === 'TOGGLE_NIGHT') {
      Alert.alert('HAVEN', t('actions.toggle_night.alert'));
      return;
    }
    if (actionId === 'WELLNESS_GOOD' || actionId === 'WELLNESS_OK') {
      try {
        enqueueOfflineAction('WELLNESS_CHECKIN', { mood: actionId === 'WELLNESS_GOOD' ? 5 : 3 });
      } catch (_) {
        // SQLite/crypto may not be available — still show confirmation
      }
      Alert.alert('HAVEN', actionId === 'WELLNESS_GOOD' ? t('actions.wellness_good.alert') : t('actions.wellness_ok.alert'));
      return;
    }
    if (actionId === 'COGNITIVE') {
      Alert.alert('HAVEN', t('actions.cognitive.alert'));
      return;
    }
    if (actionId === 'MODE_ELDER' || actionId === 'MODE_FAMILY' || actionId === 'MODE_CARER') {
      Alert.alert('HAVEN', t('actions.mode_switch.alert'));
      return;
    }
    if (actionId.startsWith('CONSENT_ACCEPT:')) {
      const packKey = actionId.split(':')[1];
      enqueueOfflineAction('CONSENT_PACK_DECIDE', { pack_key: packKey, decision: 'accepted' });
      // Fallback description: Akkoord / Accepted
      Alert.alert('HAVEN', t('actions.consent_accept.alert', { packKey }));
      return;
    }
    if (actionId.startsWith('CONSENT_DECLINE:')) {
      const packKey = actionId.split(':')[1];
      enqueueOfflineAction('CONSENT_PACK_DECIDE', { pack_key: packKey, decision: 'declined' });
      Alert.alert('HAVEN', t('actions.consent_decline.alert'));
      return;
    }
    if (actionId.startsWith('CONSENT_DEFER:')) {
      const packKey = actionId.split(':')[1];
      enqueueOfflineAction('CONSENT_PACK_DECIDE', { pack_key: packKey, decision: 'deferred' });
      // Fallback description: Later / oké
      Alert.alert('HAVEN', t('actions.consent_defer.alert'));
      return;
    }
    if (actionId.startsWith('CALL_ANSWER:')) {
      const sessionId = actionId.split(':')[1];
      if (!client) {
        Alert.alert('HAVEN', t('actions.signin_required.alert'));
        return;
      }
      try {
        if (!elderId) throw new Error('Missing elder profile for signed-in session');
        await client.videoCallJoinToken({ session_id: sessionId, elder_id: elderId });
        Alert.alert('HAVEN', t('actions.call_answered.alert', { sessionId }));
      } catch (error) {
        Alert.alert(t('haven_explanation_title'), translateElderError(error));
      }
      return;
    }
    if (actionId.startsWith('CALL_DECLINE:')) {
      const sessionId = actionId.split(':')[1];
      if (client) {
        try {
          await fetch(`${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/fn-video-call-end`, {
            method: 'POST',
            headers: {
              authorization: `Bearer ${session?.access_token}`,
              'content-type': 'application/json',
            },
            body: JSON.stringify({ session_id: sessionId }),
          });
        } catch (_) {}
      }
      Alert.alert('HAVEN', t('actions.call_declined.alert', { sessionId }));
      return;
    }
    if (actionId.startsWith('CHECKIN:')) {
      const parts = actionId.split(':');
      const period = parts[1] ?? 'morning';
      const mood = parts[2] ?? '3';
      try {
        enqueueOfflineAction('DAILY_CHECKIN', { period, mood_score: Number(mood) });
      } catch (_) {
        // SQLite/crypto may not be available — still show confirmation
      }
      const moodNum = Number(mood);
      const moodLabel = moodNum >= 5 ? '😄' : moodNum >= 3 ? '😐' : '😔';
      Alert.alert('HAVEN', `${moodLabel} ${t('actions.checkin_received.alert', { period })}`);
      return;
    }

    // === NEW: Unified Daily Rhythm Flow ===
    if (actionId === 'START_DAILY_RHYTHM') {
      Alert.alert('HAVEN', t('actions.daily_rhythm.start'));
      // In a real implementation, this would open a guided modal with 3 steps
      // For now we trigger the first check-in
      enqueueOfflineAction('DAILY_CHECKIN', { period: 'morning', mood_score: 4 });
      return;
    }

    // === Memory Recap: "What did I do yesterday?" ===
    if (actionId === 'MEMORY_RECAP_YESTERDAY') {
      Alert.alert('HAVEN', t('actions.memory_recap.alert'));
      // In a full implementation, this would fetch and display recent companion memories
      return;
    }
    if (actionId.startsWith('CONFIRM_MED:')) {
      const medId = actionId.split(':')[1];
      enqueueOfflineAction('CONFIRM_MEDICATION', { medication_id: medId, status: 'medication_taken' });
      Alert.alert('HAVEN', t('actions.confirm_med.alert'));
      return;
    }
    if (actionId.startsWith('DENY_MED:')) {
      const medId = actionId.split(':')[1];
      enqueueOfflineAction('DENY_MEDICATION', { medication_id: medId });
      Alert.alert('HAVEN', t('actions.deny_med.alert'));
      return;
    }
    if (actionId === 'FALL_OK:' || actionId.startsWith('FALL_OK:')) {
      enqueueOfflineAction('FALL_RESPONSE', { status: 'ok', fall_response: 'self_resolved' });
      Alert.alert('HAVEN', t('actions.fall_ok.alert'));
      return;
    }
    if (actionId === 'FALL_HELP:' || actionId.startsWith('FALL_HELP:')) {
      enqueueOfflineAction('FALL_RESPONSE', { status: 'help_needed', fall_response: 'escalated' });
      Alert.alert('HAVEN', t('actions.fall_help.alert'));
      return;
    }
    if (actionId.startsWith('TAKE:')) {
      const medicationId = actionId.split(':')[1];
      if (!client) {
        enqueueOfflineAction('CONFIRM_MEDICATION', { medication_id: medicationId, screen_id: screenId });
        Alert.alert('HAVEN', t('actions.take_offline.alert'));
        return;
      }
      try {
        if (!elderId) throw new Error('Missing elder profile for signed-in session');
        await client.voice({ elder_id: elderId, screen_id: 'PILLS', transcript_text: 'I took it', locale: 'en-GB' });
        Alert.alert('HAVEN', t('actions.take_success.alert'));
      } catch (error) {
        if (classifyNetworkError(error) === 'offline') {
          enqueueOfflineAction('CONFIRM_MEDICATION', { medication_id: medicationId, screen_id: screenId });
          Alert.alert('HAVEN', t('actions.take_offline_fallback.alert'));
          return;
        }
        Alert.alert(t('haven_explanation_title'), translateElderError(error));
      }
      return;
    }
    if (actionId.startsWith('SNOOZE:')) {
      enqueueOfflineAction('SNOOZE_MEDICATION', { medication_id: actionId.split(':')[1], delay_minutes: 15 });
      Alert.alert('HAVEN', t('actions.snooze.alert'));
      return;
    }
    if (!client) {
      Alert.alert('HAVEN', t('actions.live_signin_required.alert'));
      return;
    }
    try {
      if (!elderId) throw new Error('Missing elder profile for signed-in session');
      if (screenId === 'PILLS') await client.voice({ elder_id: elderId, screen_id: 'PILLS', transcript_text: 'I took it', locale: 'en-GB' });
      else if (screenId === 'TODAY') await client.screenData({ elder_id: elderId, screen_id: 'TODAY', locale: 'en-GB' });
      else await client.screenData({ elder_id: elderId, screen_id: screenId, locale: 'en-GB' });
      Alert.alert('HAVEN', t('actions.action_completed.alert', { actionId }));
    } catch (error) {
      Alert.alert(t('haven_explanation_title'), translateElderError(error));
    }
  }, [client, elderId, screenId, t]);

  return { handlePrimaryAction };
}
