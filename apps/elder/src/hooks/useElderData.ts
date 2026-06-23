// ─── Live Elder Data Hook (Supabase Realtime + REST) ───
// Replaces empty arrays in ElderScreen with real data from Supabase.
// Falls back gracefully to empty arrays if not authenticated or on error.

import { useEffect, useState, useCallback, useRef } from 'react';
import { useAuth } from '../auth/AuthProvider';
import type { MedicationRow, TaskRow, MessageRow, ScamEventRow, FamilyMember, BuurtRow, VisitLogRow } from '../renderer/ScreenRenderer';

interface ElderLiveData {
  family: FamilyMember[];
  medications: MedicationRow[];
  tasks: TaskRow[];
  messages: MessageRow[];
  scamEvents: ScamEventRow[];
  buurt: BuurtRow;
  visits: VisitLogRow[];
  loading: boolean;
  error: string | null;
}

const EMPTY_DATA: ElderLiveData = {
  family: [],
  medications: [],
  tasks: [],
  messages: [],
  scamEvents: [],
  buurt: { active: false, nearbyCount: 0, tags: [], walkBuddyCount: 0, events: [] },
  visits: [],
  loading: true,
  error: null,
};

function scoreToLevel(score: number): 'none' | 'amber' | 'rood' | 'zwart' {
  if (score >= 80) return 'zwart';
  if (score >= 50) return 'rood';
  if (score >= 25) return 'amber';
  return 'none';
}

export function useElderData(elderId: string): ElderLiveData & { retry: () => void } {
  const { supabase, session } = useAuth();
  const [data, setData] = useState<ElderLiveData>(EMPTY_DATA);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // ─── Per-table fetchers (Fix #5: split fetchInitialData) ───

  const fetchFamily = useCallback(async () => {
    const { data: familyRows } = await supabase
      .from('family_relationships')
      .select('id, family_member_id, relation_type, is_primary, profiles!family_relationships_family_member_id_fkey(preferred_name)')
      .eq('elder_id', elderId)
      .is('deleted_at', null);

    const family: FamilyMember[] = (familyRows ?? []).map((row: any) => ({
      id: row.family_member_id,
      name: row.profiles?.preferred_name ?? 'Familie',
      relation: row.relation_type ?? 'kind',
      isPrimary: !!row.is_primary,
    }));
    setData((prev) => ({ ...prev, family }));
  }, [supabase, elderId]);

  const fetchMedications = useCallback(async () => {
    const { data: medRows } = await supabase
      .from('medications')
      .select('id, name_nl, name_en, dose_description_nl, dose_description_en, frequency, schedule_times')
      .eq('elder_id', elderId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(10);

    const medications: MedicationRow[] = (medRows ?? []).map((row: any) => {
      const times = row.schedule_times as string[] | null;
      const nextTime = times?.[0] ?? '';
      return {
        id: row.id,
        name: row.name_nl ?? row.name_en ?? 'Medicijn',
        dose: row.dose_description_nl ?? '',
        descriptionNl: row.dose_description_nl ?? '',
        descriptionEn: row.dose_description_en ?? row.dose_description_nl ?? '',
        time: nextTime,
        status: 'planned' as const,
      };
    });
    setData((prev) => ({ ...prev, medications }));
  }, [supabase, elderId]);

  const fetchTasks = useCallback(async () => {
    const { data: taskRows } = await supabase
      .from('tasks')
      .select('id, title_nl, title_en, due_date, completed_at')
      .eq('elder_id', elderId)
      .is('deleted_at', null)
      .order('due_date', { ascending: true })
      .limit(10);

    const tasks: TaskRow[] = (taskRows ?? []).map((row: any) => ({
      id: row.id,
      icon: '📌',
      title: row.title_nl ?? row.title_en ?? 'Taak',
      titleEn: row.title_en ?? row.title_nl ?? 'Task',
      subtitle: row.due_date
        ? new Date(row.due_date).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })
        : '',
      done: !!row.completed_at,
    }));
    setData((prev) => ({ ...prev, tasks }));
  }, [supabase, elderId]);

  const fetchMessages = useCallback(async () => {
    const { data: msgRows } = await supabase
      .from('family_messages')
      .select('id, sender_id, sender_role, message_type, content_nl, content_en, created_at, read_at')
      .eq('elder_id', elderId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(20);

    const messages: MessageRow[] = (msgRows ?? []).map((row: any) => ({
      id: row.id,
      from: row.sender_role === 'family' ? 'Familie' : row.sender_role === 'carer' ? 'Verzorger' : 'HAVEN',
      body: row.content_nl ?? row.content_en ?? '',
      kind: (row.content_nl === '❤️' || row.content_nl?.includes('hartje')) ? 'heart' as const : 'text' as const,
      unread: !row.read_at,
    }));
    setData((prev) => ({ ...prev, messages }));
  }, [supabase, elderId]);

  const fetchScamEvents = useCallback(async () => {
    const { data: scamRows } = await supabase
      .from('scam_events')
      .select('id, channel, explanation_nl, explanation_en, score_composite, family_notified, created_at')
      .eq('elder_id', elderId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(10);

    const scamEvents: ScamEventRow[] = (scamRows ?? []).map((row: any) => ({
      id: row.id,
      level: scoreToLevel(row.score_composite ?? 0),
      channel: row.channel ?? 'unknown',
      score: row.score_composite ?? 0,
      explanation: row.explanation_nl ?? row.explanation_en ?? '',
      notified: !!row.family_notified,
    }));
    setData((prev) => ({ ...prev, scamEvents }));
  }, [supabase, elderId]);

  const fetchBuurt = useCallback(async () => {
    const { data: buurtProfile } = await supabase
      .from('neighbourhood_profiles')
      .select('id, is_active')
      .eq('elder_id', elderId)
      .maybeSingle();

    const { data: connections } = await supabase
      .from('neighbourhood_connections')
      .select('id')
      .or(`initiator_elder_id.eq.${elderId},recipient_elder_id.eq.${elderId}`)
      .eq('status', 'accepted');

    const buurt: BuurtRow = {
      active: buurtProfile?.is_active ?? false,
      nearbyCount: connections?.length ?? 0,
      tags: [],
      walkBuddyCount: 0,
      events: [],
    };
    setData((prev) => ({ ...prev, buurt }));
  }, [supabase, elderId]);

  const fetchVisits = useCallback(async () => {
    const { data: visitRows } = await supabase
      .from('carer_visit_logs')
      .select('id, visit_date, check_in_time, check_out_time, observations_nl, carer_id, profiles!carer_visit_logs_carer_id_fkey(preferred_name)')
      .eq('elder_id', elderId)
      .order('visit_date', { ascending: false })
      .limit(10);

    const visits: VisitLogRow[] = (visitRows ?? []).map((row: any) => ({
      date: row.visit_date ?? (row.check_in_time ? new Date(row.check_in_time).toLocaleDateString('nl-NL') : ''),
      carer: row.profiles?.preferred_name ?? 'Verzorger',
      note: row.observations_nl ?? '',
    }));
    setData((prev) => ({ ...prev, visits }));
  }, [supabase, elderId]);

  const fetchAll = useCallback(async () => {
    if (!session || elderId === 'signed-out') return;
    setData((prev) => ({ ...prev, loading: true, error: null }));
    try {
      await Promise.all([
        fetchFamily(),
        fetchMedications(),
        fetchTasks(),
        fetchMessages(),
        fetchScamEvents(),
        fetchBuurt(),
        fetchVisits(),
      ]);
      setData((prev) => ({ ...prev, loading: false }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Gegevens ophalen mislukt';
      console.warn('[useElderData] fetch failed, using fallback:', error);
      setData((prev) => ({ ...prev, loading: false, error: message }));
    }
  }, [session, elderId, fetchFamily, fetchMedications, fetchTasks, fetchMessages, fetchScamEvents, fetchBuurt, fetchVisits]);

  // Subscribe to realtime changes — re-fetch only the affected table
  useEffect(() => {
    if (!session || elderId === 'signed-out') {
      setData(EMPTY_DATA);
      return;
    }

    fetchAll().then(() => {
      setData((prev) => ({ ...prev, loading: false }));
    }).catch(() => {
      setData((prev) => ({ ...prev, loading: false }));
    });

    const channel = supabase
      .channel(`elder-${elderId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'family_messages',
        filter: `elder_id=eq.${elderId}`,
      }, () => { fetchMessages().catch(() => {}); })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'medications',
        filter: `elder_id=eq.${elderId}`,
      }, () => { fetchMedications().catch(() => {}); })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'scam_events',
        filter: `elder_id=eq.${elderId}`,
      }, () => { fetchScamEvents().catch(() => {}); })
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'wellness_checkins',
        filter: `elder_id=eq.${elderId}`,
      }, () => { fetchTasks().catch(() => {}); })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'carer_visit_logs',
        filter: `elder_id=eq.${elderId}`,
      }, () => { fetchVisits().catch(() => {}); })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'carer_handover_notes',
        filter: `elder_id=eq.${elderId}`,
      }, () => { fetchVisits().catch(() => {}); })
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [session, elderId, supabase, fetchAll, fetchMessages, fetchMedications, fetchScamEvents, fetchTasks, fetchVisits]);

  const retry = useCallback(() => {
    fetchAll();
  }, [fetchAll]);

  return { ...data, retry };
}
