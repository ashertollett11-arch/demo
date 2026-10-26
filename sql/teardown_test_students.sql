-- ===========================================================================
--  SimplyApply - remove the 15 seeded test students
-- ===========================================================================
--  Matches only on the @seed.simplyapply.test email domain, so it cannot
--  touch a real account. Safe to run twice.
-- ===========================================================================

begin;

create temporary table _seed_students on commit drop as
  select id from auth.users where email like '%@seed.simplyapply.test';

-- things an employer may have done to them while testing
delete from student_statuses           where student_id in (
  select id from "Students" where user_id in (select id from _seed_students));
delete from location_applications      where student_user_id in (select id from _seed_students);
delete from employer_student_distances where student_user_id in (select id from _seed_students);
delete from student_notifications      where student_user_id in (select id from _seed_students);
-- notifications.student_user_id is text, not uuid, unlike every sibling
-- column, so the id has to be cast or Postgres refuses to compare them.
delete from notifications              where student_user_id in (select id::text from _seed_students);
delete from recommendations            where student_user_id in (select id from _seed_students);
delete from onboarding_emails          where user_id         in (select id from _seed_students);

delete from "Students" where user_id in (select id from _seed_students);
delete from users      where id      in (select id from _seed_students);
delete from auth.users where id      in (select id from _seed_students);

-- all three must be 0
select
  (select count(*) from auth.users where email like '%@seed.simplyapply.test') as users_left,
  (select count(*) from "Students" where email like '%@seed.simplyapply.test') as students_left,
  (select count(*) from employer_student_distances where student_user_id in
     (select id from auth.users where email like '%@seed.simplyapply.test'))   as distances_left;

commit;
-- rollback;
