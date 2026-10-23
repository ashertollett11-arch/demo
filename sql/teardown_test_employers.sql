-- ===========================================================================
--  SimplyApply - remove every seeded test employer, location and side effect
-- ===========================================================================
--  Matches purely on the @seed.simplyapply.test email domain, so it cannot
--  touch a real account. Safe to run twice; the second run deletes nothing.
--
--  Also clears anything the app created against the seed data while you were
--  testing: applications, cached distances, pipeline statuses and both kinds
--  of notification. Child rows go first so this works whether or not the
--  foreign keys cascade.
--
--  Wrapped in a transaction: check the zeros at the bottom, then COMMIT.
-- ===========================================================================

begin;

-- Seed location ids and seed employer user ids, used throughout.
create temporary table _seed_users on commit drop as
  select id from auth.users where email like '%@seed.simplyapply.test';

create temporary table _seed_jobs on commit drop as
  select id from job where user_id in (select id from _seed_users);

create temporary table _seed_locs on commit drop as
  select id from locations where employer_id in (select id from _seed_jobs);

-- 1. things students did to the seed locations -----------------------------
delete from location_applications      where location_id          in (select id from _seed_locs);
delete from employer_student_distances where employer_location_id in (select id from _seed_locs);

-- 2. the seed employers' hiring pipeline -----------------------------------
delete from student_statuses where employer_id in (select id from _seed_jobs);

-- 3. notifications on both sides -------------------------------------------
--    Both tables key employer_id to the employer's auth user id.
delete from student_notifications where employer_id in (select id from _seed_users);
delete from notifications         where employer_id in (select id from _seed_users);

-- 4. any email bookkeeping --------------------------------------------------
delete from onboarding_emails where user_id in (select id from _seed_users);

-- 5. the seed records themselves --------------------------------------------
delete from locations where employer_id in (select id from _seed_jobs);
delete from job        where id         in (select id from _seed_jobs);
delete from profiles   where id         in (select id from _seed_users);
delete from users      where id         in (select id from _seed_users);
delete from auth.users where id         in (select id from _seed_users);

-- ---------------------------------------------------------------------------
-- Everything below must read 0 before you commit.
select
  (select count(*) from auth.users where email like '%@seed.simplyapply.test') as users_left,
  (select count(*) from job        where email like '%@seed.simplyapply.test') as companies_left,
  (select count(*) from profiles   where email like '%@seed.simplyapply.test') as profiles_left,
  (select count(*) from locations  where employer_id in
     (select id from job where email like '%@seed.simplyapply.test'))          as locations_left;

commit;
-- rollback;  -- use this instead if anything above is not 0
