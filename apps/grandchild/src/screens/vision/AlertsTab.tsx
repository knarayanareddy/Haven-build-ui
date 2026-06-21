// ─── Vision Family Dashboard: Alerts Tab ───
// Fetches live scam_events + safeguarding alerts from Supabase when authenticated
import React, { useEffect, useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { colors } from '@haven/ui/src/tokens';
import { StatusBadge } from '@haven/ui/src/visionComponents';
// DEMO: mock scam events — fallback when not authenticated
import { SCAM_EVENTS } from '@haven/ui/src/mockData';

interface LiveAlert {
  id: string;
  title: string;
  description: string;
  type: string;
  risk_level: string;
  risk_score: number;
  resolved: boolean;
  created_at: string;
}

interface AlertsTabProps {
  locale: string;
  session?: { access_token: string } | null;
}

export function AlertsTab({ locale, session }: AlertsTabProps) {
  const nl = locale.startsWith('nl');
  const [liveAlerts, setLiveAlerts] = useState<LiveAlert[] | null>(null);

  useEffect(() => {
    if (!session) return;
    const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
    const elderId = process.env.EXPO_PUBLIC_FAMILY_MEMBER_ID;
    if (!url || !elderId) return;

    const headers = {
      authorization: `Bearer ${session.access_token}`,
      apikey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? session.access_token,
    };

    fetch(`${url}/rest/v1/scam_events?elder_id=eq.${elderId}&order=created_at.desc&limit=20`, { headers })
      .then((r) => r.json())
      .then((rows) => {
        if (Array.isArray(rows) && rows.length > 0) setLiveAlerts(rows);
      })
      .catch(() => {});
  }, [session]);

  function renderAlertCard(event: { id: string; title: string; description: string; type: string; riskLevel: string; riskScore: number; resolved: boolean }) {
    const isRed = event.riskLevel === 'red';
    const isResolved = event.resolved;
    return (
      <View
        key={event.id}
        style={{
          borderRadius: 18, padding: 16, backgroundColor: colors.paper,
          borderWidth: 1,
          borderColor: isResolved ? colors.mist : isRed ? '#FECACA' : '#FDE68A',
          opacity: isResolved ? 0.7 : 1,
          gap: 6,
        }}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
            <Text style={{ fontSize: 16 }}>{isRed ? '🚨' : isResolved ? '✅' : '⚠️'}</Text>
            <Text style={{ fontSize: 15, fontWeight: '900', color: colors.ink, flex: 1 }}>{event.title}</Text>
          </View>
          <StatusBadge
            status={isResolved ? 'green' : isRed ? 'red' : 'amber'}
            label={isResolved ? (nl ? 'opgelost' : 'resolved') : event.riskLevel}
          />
        </View>
        <Text style={{ fontSize: 13, color: colors.graphite, fontWeight: '600', marginLeft: 24 }}>{event.description}</Text>
        <Text style={{ fontSize: 11, color: colors.pewter, fontWeight: '600', marginLeft: 24 }}>
          {nl ? 'Score' : 'Score'}: {event.riskScore}/100 · {event.type}
        </Text>
        {!isResolved && (
          <TouchableOpacity style={{ marginLeft: 24, marginTop: 4, backgroundColor: '#D1FAE5', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5, alignSelf: 'flex-start' }}>
            <Text style={{ fontSize: 11, fontWeight: '800', color: '#065F46' }}>{nl ? 'Markeer als opgelost' : 'Mark as resolved'}</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.linen }} contentContainerStyle={{ padding: 16, gap: 12 }}>
      {/* Info banner */}
      <View style={{ backgroundColor: '#EDE9FE', borderWidth: 1, borderColor: '#C4B5FD', borderRadius: 16, padding: 12, gap: 4 }}>
        <Text style={{ fontSize: 13, fontWeight: '800', color: '#5B21B6' }}>🛡️ SCHILD — {nl ? 'Fraude- & Oplichtingsbescherming' : 'Fraud & Scam Protection'}</Text>
        <Text style={{ fontSize: 12, color: '#6D28D9', fontWeight: '600' }}>
          {nl
            ? 'HAVEN monitort oproepen, berichten, transacties en browseractiviteit.'
            : 'HAVEN monitors calls, messages, transactions and browser activity.'}
        </Text>
      </View>

      {/* Live data indicator */}
      {liveAlerts && (
        <View style={{ backgroundColor: '#D1FAE5', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4, alignSelf: 'flex-start' }}>
          <Text style={{ fontSize: 11, fontWeight: '700', color: '#065F46' }}>● {nl ? 'Live data' : 'Live data'}</Text>
        </View>
      )}

      {/* Scam event cards */}
      {liveAlerts
        ? liveAlerts.map((alert) => renderAlertCard({
            id: alert.id,
            title: alert.title,
            description: alert.description,
            type: alert.type,
            riskLevel: alert.risk_level,
            riskScore: alert.risk_score,
            resolved: alert.resolved,
          }))
        : SCAM_EVENTS.map((event) => renderAlertCard({
            id: event.id,
            title: event.title,
            description: event.description,
            type: event.type,
            riskLevel: event.riskLevel,
            riskScore: event.riskScore,
            resolved: event.resolved,
          }))
      }
    </ScrollView>
  );
}
