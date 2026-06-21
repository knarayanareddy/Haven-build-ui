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
}

const EMPTY_DATA: ElderLiveData = {
  family: [],
  medications: [],
  tasks: [],
  messages: [],
  scamEvents: [],
  buurt: { active: false, nearbyCount: 0, tags: [], walkBuddyCount: 0, events: [] },
  visits: [],
};

export function useElderData(elderId: string): ElderLiveData {
  const { supabase, session } = useAuth();
  const [data, setData] = useState<ElderLiveData>(EMPTY_DATA);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const fetchInitialData = useCallback(async () => {
    if (!session || elderId === 'signed-out') return;

    try {
      // Fetch family relationships
      const { data: familyRows } = await supabase
        .from('family_relationships')
        .select('id, family_member_id, relationship_type, profiles!family_relationships_family_member_id_fkey(preferred_name)')
        .eq('elder_id', elderId)
        .is('deleted_at', null);

      const family: FamilyMember[] = (familyRows ?? []).map((row: any) => ({
        id: row.family_member_id,
        name: row.profiles?.preferred_name ?? 'Familie',
        relation: row.relationship_type ?? 'kind',
      }));

      // Fetch medications
      const { data: medRows } = await supabase
        .from('medications')
        .select('id, name_nl, name_en, dosage, frequency, time_slots')
        .eq('elder_id', elderId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(10);

      const medications: MedicationRow[] = (medRows ?? []).map((row: any) => ({
        id: row.id,
        name: row.name_nl ?? row.name_en ?? 'Medicijn',
        dosage: row.dosage ?? '',
        frequency: row.frequency ?? 'daily',
        taken: row.time_slots ? (row.time_slots as string[]).map(() => false) : [false],
      }));

      // Fetch tasks
      const { data: taskRows } = await supabase
        .from('tasks')
        .select('id, title_nl, title_en, due_date, completed_at')
        .eq('elder_id', elderId)
        .is('deleted_at', null)
        .order('due_date', { ascending: true })
        .limit(10);

      const tasks: TaskRow[] = (taskRows ?? []).map((row: any) => ({
        id: row.id,
        label: row.title_nl ?? row.title_en ?? 'Taak',
        done: !!row.completed_at,
        time: row.due_date ? new Date(row.due_date).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' }) : '',
      }));

      // Fetch messages
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
        kind: row.message_type === 'heart' ? 'heart' : 'text',
        unread: !row.read_at,
      }));

      // Fetch scam events
      const { data: scamRows } = await supabase
        .from('scam_events')
        .select('id, source_type, summary_nl, summary_en, confidence_score, resolved_at, created_at')
        .eq('elder_id', elderId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(10);

      const scamEvents: ScamEventRow[] = (scamRows ?? []).map((row: any) => ({
        id: row.id,
        source: row.source_type ?? 'unknown',
        summary: row.summary_nl ?? row.summary_en ?? '',
        confidence: row.confidence_score ?? 0,
        resolved: !!row.resolved_at,
      }));

      // Fetch buurt data
      const { data: buurtProfile } = await supabase
        .from('neighbourhood_profiles')
        .select('id, is_active')
        .eq('elder_id', elderId)
        .maybeSingle();

      const { data: connections } = await supabase
        .from('neighbourhood_connections')
        .select('id')
        .eq('elder_id', elderId)
        .eq('status', 'active');

      const buurt: BuurtRow = {
        active: buurtProfile?.is_active ?? false,
        nearbyCount: connections?.length ?? 0,
        tags: [],
        walkBuddyCount: 0,
        events: [],
      };

      // Fetch visit logs from carer_visit_logs (actual carer entries)
      const { data: visitRows } = await supabase
        .from('carer_visit_logs')
        .select('id, visit_date, check_in_time, check_out_time, notes_nl, carer_id, profiles!carer_visit_logs_carer_id_fkey(preferred_name)')
        .eq('elder_id', elderId)
        .order('visit_date', { ascending: false })
        .limit(10);

      const visits: VisitLogRow[] = (visitRows ?? []).map((row: any) => ({
        date: row.visit_date ?? (row.check_in_time ? new Date(row.check_in_time).toLocaleDateString('nl-NL') : ''),
        carer: row.profiles?.preferred_name ?? 'Verzorger',
        note: row.notes_nl ?? '',
      }));

      setData({ family, medications, tasks, messages, scamEvents, buurt, visits });
    } catch (error) {
      // Silently fall back to empty data — screens will show mock data as before
      console.warn('[useElderData] fetch failed, using fallback:', error);
    }
  }, [supabase, session, elderId]);

  // Subscribe to realtime changes
  useEffect(() => {
    if (!session || elderId === 'signed-out') {
      setData(EMPTY_DATA);
      return;
    }

    fetchInitialData();

    // Set up realtime subscriptions
    const channel = supabase
      .channel(`elder-${elderId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'family_messages',
        filter: `elder_id=eq.${elderId}`,
      }, () => {
        // Re-fetch messages on any change
        fetchInitialData();
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'medications',
        filter: `elder_id=eq.${elderId}`,
      }, () => {
        fetchInitialData();
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'scam_events',
        filter: `elder_id=eq.${elderId}`,
      }, () => {
        fetchInitialData();
      })
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'wellness_checkins',
        filter: `elder_id=eq.${elderId}`,
      }, () => {
        fetchInitialData();
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'carer_visit_logs',
        filter: `elder_id=eq.${elderId}`,
      }, () => {
        fetchInitialData();
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'carer_handover_notes',
        filter: `elder_id=eq.${elderId}`,
      }, () => {
        fetchInitialData();
      })
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [session, elderId, supabase, fetchInitialData]);

  return data;
}
