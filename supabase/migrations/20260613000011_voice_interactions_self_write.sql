-- HAVEN voice-interaction self-write completion.
-- Allows authenticated elders to persist and update their own voice interactions through user-scoped clients.

create policy voice_elder_insert
on voice_interactions for insert
with check (elder_id = auth.uid());

create policy voice_elder_update
on voice_interactions for update
using (elder_id = auth.uid() and deleted_at is null)
with check (elder_id = auth.uid());
