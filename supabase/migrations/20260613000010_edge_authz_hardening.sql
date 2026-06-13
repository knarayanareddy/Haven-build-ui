-- HAVEN edge-authz hardening follow-up.
-- Enables RLS-backed companion-memory writes and read access to audit history.

create policy memory_elder_insert
on companion_memory for insert
with check (elder_id = auth.uid());

create policy memory_elder_update
on companion_memory for update
using (elder_id = auth.uid() and deleted_at is null)
with check (elder_id = auth.uid());

create policy audit_log_self_select
on audit_log for select
using (elder_id = auth.uid() or actor_id = auth.uid());

create policy audit_log_admin_select
on audit_log for select
using ((select role from profiles where id = auth.uid()) = 'admin');

create policy audit_log_authenticated_insert
on audit_log for insert
with check (auth.uid() is not null and actor_id = auth.uid());

create policy audit_log_service_insert
on audit_log for insert
with check (auth.role() = 'service_role');
