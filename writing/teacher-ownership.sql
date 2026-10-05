-- Existing assignments belong to the sole registered teacher when upgrading.
-- If multiple teachers already exist, explicitly assign legacy rows before running.
begin;
alter table public.writing_assignments add column if not exists teacher_id uuid references public.writing_teachers(user_id);
alter table public.writing_assignments alter column teacher_id set default auth.uid();
do $$ begin
 if exists(select 1 from public.writing_assignments where teacher_id is null) then
  if (select count(*) from public.writing_teachers) <> 1 then
   raise exception 'Assign legacy assignments to their owners before upgrading';
  end if;
  update public.writing_assignments set teacher_id=(select user_id from public.writing_teachers limit 1) where teacher_id is null;
 end if;
end $$;
alter table public.writing_assignments alter column teacher_id set not null;
create index if not exists writing_assignments_teacher_id_idx on public.writing_assignments(teacher_id);
create index if not exists writing_submissions_assignment_id_idx on public.writing_submissions(assignment_id);

alter policy "writing teachers can read assignments" on public.writing_assignments
 using (teacher_id=(select auth.uid()) and exists(select 1 from public.writing_teachers t where t.user_id=(select auth.uid())));
alter policy "writing teachers can create assignments" on public.writing_assignments
 with check (teacher_id=(select auth.uid()) and exists(select 1 from public.writing_teachers t where t.user_id=(select auth.uid())));
alter policy "writing teachers can update assignments" on public.writing_assignments
 using (teacher_id=(select auth.uid()) and exists(select 1 from public.writing_teachers t where t.user_id=(select auth.uid())))
 with check (teacher_id=(select auth.uid()) and exists(select 1 from public.writing_teachers t where t.user_id=(select auth.uid())));
alter policy "writing teachers can read submissions" on public.writing_submissions
 using (assignment_id in (select id from public.writing_assignments where teacher_id=(select auth.uid())));
alter policy "writing teachers can update submissions" on public.writing_submissions
 using (assignment_id in (select id from public.writing_assignments where teacher_id=(select auth.uid())))
 with check (assignment_id in (select id from public.writing_assignments where teacher_id=(select auth.uid())));
commit;
