-- ===========================================================================
--  Give each location its own hiring pipeline
-- ===========================================================================
--  student_statuses was keyed on (employer_id, student_id), so a status was
--  company-wide: marking someone hired at one location marked them hired at
--  every location. The location_id column already existed but was never
--  written — 131 rows, none of them set.
--
--  After this, each location keeps its own new / contacted / hired pipeline.
--  Contacting someone at another location no longer changes their status
--  here; the app shows it as a tag instead, so nobody gets called twice.
--
--  Note employer_id holds the employer's AUTH USER id (job.user_id), not
--  job.id, which is why the backfill joins through job.
--
--  Check the counts at the bottom, then COMMIT.
-- ===========================================================================

begin;

-- 1. 'new' rows no longer mean anything: a student with no row is new.
delete from student_statuses where status = 'new';

-- 2. Real statuses predate locations, so attach them to the employer's
--    oldest location — the one a free employer has live, and the first a Pro
--    employer created.
update student_statuses ss
set location_id = (
  select l.id
  from locations l
  join job j on j.id = l.employer_id
  where j.user_id = ss.employer_id
  order by l.created_at asc
  limit 1
)
where ss.location_id is null;

-- 3. Anything left belongs to an employer with no locations at all and can
--    never be shown, so it goes.
delete from student_statuses where location_id is null;

-- 4. One pipeline entry per student per location.
alter table student_statuses
  drop constraint student_statuses_employer_id_student_id_key;

alter table student_statuses
  alter column location_id set not null;

alter table student_statuses
  add constraint student_statuses_employer_student_location_key
  unique (employer_id, student_id, location_id);

-- ---------------------------------------------------------------------------
-- rows_left should equal the number of real contacted/hired statuses you had
-- (3 at the time this was written), and unscoped must be 0.
select
  (select count(*) from student_statuses)                           as rows_left,
  (select count(*) from student_statuses where location_id is null) as unscoped,
  (select count(*) from student_statuses where status = 'new')      as stale_new;

commit;
-- rollback;
