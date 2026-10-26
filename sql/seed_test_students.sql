-- ===========================================================================
--  SimplyApply - 15 test students looking for work, around Walton County
-- ===========================================================================
--  Built the way the new onboarding builds them: each student picks days,
--  and one time window is applied to every day they picked.
--    mornings   5:00 AM - 12:00 PM   shift_preference 'morning'   (4 students)
--    all day   10:00 AM - 10:00 PM   shift_preference 'flexible'  (5 students)
--    evenings   3:00 PM - 10:00 PM   shift_preference 'night'     (6 students)
--
--  Two sit outside those windows, as if they had edited their schedule in
--  the profile afterwards: Noah Fitzgerald 4:30 PM-11:00 PM and Grace
--  Sullivan 6:00 AM-2:00 PM.
--
--  Tagged with the @seed.simplyapply.test email domain, which the teardown
--  matches on. Phones use the real 850 area code with the reserved 555-01xx
--  range, so none of them can reach a real person.
--
--  Section 4 matters: an employer sees a student only when profile_complete
--  is true, is_looking is not false, AND a row exists in
--  employer_student_distances. Nothing recalculates distances for rows
--  inserted straight into Postgres, so they are measured and included here.
--
--  Check the counts at the bottom, then COMMIT.
-- ===========================================================================

begin;

-- 1. auth users -------------------------------------------------------------
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, email_change, email_change_token_new, recovery_token
)
select '00000000-0000-0000-0000-000000000000'::uuid, s.id, 'authenticated', 'authenticated',
       s.email, '$2a$10$seedaccountnotusableforloginXXXXXXXXXXXXXXXXXXXXXXXXXX',
       now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb,
       now(), now(), '', '', '', ''
from (values
    ('57d00000-0000-4000-8000-000000000001'::uuid,'maya-rodriguez@seed.simplyapply.test'),
    ('57d00000-0000-4000-8000-000000000002'::uuid,'caleb-nguyen@seed.simplyapply.test'),
    ('57d00000-0000-4000-8000-000000000003'::uuid,'harper-collins@seed.simplyapply.test'),
    ('57d00000-0000-4000-8000-000000000004'::uuid,'diego-alvarez@seed.simplyapply.test'),
    ('57d00000-0000-4000-8000-000000000005'::uuid,'ava-thompson@seed.simplyapply.test'),
    ('57d00000-0000-4000-8000-000000000006'::uuid,'jackson-reed@seed.simplyapply.test'),
    ('57d00000-0000-4000-8000-000000000007'::uuid,'sofia-martinez@seed.simplyapply.test'),
    ('57d00000-0000-4000-8000-000000000008'::uuid,'elijah-brooks@seed.simplyapply.test'),
    ('57d00000-0000-4000-8000-000000000009'::uuid,'isabella-chen@seed.simplyapply.test'),
    ('57d00000-0000-4000-8000-000000000010'::uuid,'mason-webb@seed.simplyapply.test'),
    ('57d00000-0000-4000-8000-000000000011'::uuid,'lily-patterson@seed.simplyapply.test'),
    ('57d00000-0000-4000-8000-000000000012'::uuid,'noah-fitzgerald@seed.simplyapply.test'),
    ('57d00000-0000-4000-8000-000000000013'::uuid,'zoe-carter@seed.simplyapply.test'),
    ('57d00000-0000-4000-8000-000000000014'::uuid,'owen-mitchell@seed.simplyapply.test'),
    ('57d00000-0000-4000-8000-000000000015'::uuid,'grace-sullivan@seed.simplyapply.test')
) as s(id, email);

-- 2. role rows --------------------------------------------------------------
insert into users (id, role)
values
    ('57d00000-0000-4000-8000-000000000001'::uuid,'student'),
    ('57d00000-0000-4000-8000-000000000002'::uuid,'student'),
    ('57d00000-0000-4000-8000-000000000003'::uuid,'student'),
    ('57d00000-0000-4000-8000-000000000004'::uuid,'student'),
    ('57d00000-0000-4000-8000-000000000005'::uuid,'student'),
    ('57d00000-0000-4000-8000-000000000006'::uuid,'student'),
    ('57d00000-0000-4000-8000-000000000007'::uuid,'student'),
    ('57d00000-0000-4000-8000-000000000008'::uuid,'student'),
    ('57d00000-0000-4000-8000-000000000009'::uuid,'student'),
    ('57d00000-0000-4000-8000-000000000010'::uuid,'student'),
    ('57d00000-0000-4000-8000-000000000011'::uuid,'student'),
    ('57d00000-0000-4000-8000-000000000012'::uuid,'student'),
    ('57d00000-0000-4000-8000-000000000013'::uuid,'student'),
    ('57d00000-0000-4000-8000-000000000014'::uuid,'student'),
    ('57d00000-0000-4000-8000-000000000015'::uuid,'student');

-- 3. the students -----------------------------------------------------------
--    `availability` is built from each student's day list rather than written
--    out seven times each: every day of the week appears, carrying the
--    student's window when they chose that day and "-" hours when they did not.
insert into "Students" (
  user_id, name, age, gender, school, gpa, location, zip_code, email, phone,
  availability, shift_preference, interests, preferred_jobs,
  profile_complete, is_looking, email_notifications, status
)
select
  s.user_id, s.name, s.age, s.gender, s.school, s.gpa, s.location, s.zip_code, s.email, s.phone,
  (select jsonb_agg(
            jsonb_build_object(
              'day', d,
              'start', s.win_start,
              'end', s.win_end,
              'available', d = any(s.days),
              'hours', case when d = any(s.days) then s.win_hours else '-' end
            ) order by ord)
     from unnest(ARRAY['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'])
          with ordinality as t(d, ord)),
  s.pref, s.interests, s.preferred_jobs,
  true, true, false, 'new'
from (values
    ('57d00000-0000-4000-8000-000000000001'::uuid,'Maya Rodriguez',17,'female','South Walton High School',3.8,'72 Clareon Dr, Santa Rosa Beach, FL','32459','maya-rodriguez@seed.simplyapply.test','8505550101',
     ARRAY['Thursday','Friday','Saturday','Sunday']::text[],'3:00 PM','10:00 PM','7','night',ARRAY['School','Music','Art']::text[],ARRAY['Barista','Cashier','Server']::text[]),
    ('57d00000-0000-4000-8000-000000000002'::uuid,'Caleb Nguyen',16,'male','South Walton High School',3.4,'164 Lakeview Dr, Santa Rosa Beach, FL','32459','caleb-nguyen@seed.simplyapply.test','8505550102',
     ARRAY['Friday','Saturday','Sunday']::text[],'3:00 PM','10:00 PM','7','night',ARRAY['Sports','Gaming','Fitness']::text[],ARRAY['Busser','Food Runner','Dishwasher']::text[]),
    ('57d00000-0000-4000-8000-000000000003'::uuid,'Harper Collins',15,'female','Emerald Coast Middle School',4.0,'300 Beach Bike Way, Santa Rosa Beach, FL','32459','harper-collins@seed.simplyapply.test','8505550103',
     ARRAY['Saturday','Sunday']::text[],'10:00 AM','10:00 PM','12','flexible',ARRAY['Reading','Art','Volunteering']::text[],ARRAY['Ice Cream Scooper','Cashier','Library Assistant']::text[]),
    ('57d00000-0000-4000-8000-000000000004'::uuid,'Diego Alvarez',18,'male','Northwest Florida State College',3.1,'55 Pine Lands Loop, Santa Rosa Beach, FL','32459','diego-alvarez@seed.simplyapply.test','8505550104',
     ARRAY['Monday','Tuesday','Wednesday','Thursday','Friday']::text[],'5:00 AM','12:00 PM','7','morning',ARRAY['Fitness','Cooking','Outdoors']::text[],ARRAY['Cook','Car Wash Attendant','Stock Associate']::text[]),
    ('57d00000-0000-4000-8000-000000000005'::uuid,'Ava Thompson',17,'female','Seacoast Collegiate High School',3.9,'128 Cerulean Way, Santa Rosa Beach, FL','32459','ava-thompson@seed.simplyapply.test','8505550105',
     ARRAY['Monday','Saturday','Sunday']::text[],'10:00 AM','10:00 PM','12','flexible',ARRAY['School','Photography','Music']::text[],ARRAY['Sales Associate','Customer Service','Front Desk']::text[]),
    ('57d00000-0000-4000-8000-000000000006'::uuid,'Jackson Reed',16,'male','Freeport High School',2.9,'16 Bayshore Dr, Freeport, FL','32439','jackson-reed@seed.simplyapply.test','8505550106',
     ARRAY['Wednesday','Thursday','Friday','Saturday']::text[],'3:00 PM','10:00 PM','7','night',ARRAY['Gaming','Sports']::text[],ARRAY['Dishwasher','Busser','Cart Attendant']::text[]),
    ('57d00000-0000-4000-8000-000000000007'::uuid,'Sofia Martinez',19,'female','Northwest Florida State College',3.6,'4300 Sandestin Blvd S, Miramar Beach, FL','32550','sofia-martinez@seed.simplyapply.test','8505550107',
     ARRAY['Monday','Wednesday','Friday']::text[],'5:00 AM','12:00 PM','7','morning',ARRAY['Cooking','Volunteering','Reading']::text[],ARRAY['Barista','Host/Hostess','Office Assistant']::text[]),
    ('57d00000-0000-4000-8000-000000000008'::uuid,'Elijah Brooks',15,'male','South Walton High School',3.3,'21 Trigger Trail, Santa Rosa Beach, FL','32459','elijah-brooks@seed.simplyapply.test','8505550108',
     ARRAY['Saturday','Sunday']::text[],'10:00 AM','10:00 PM','12','flexible',ARRAY['Outdoors','Sports','Gaming']::text[],ARRAY['Cart Attendant','Bagger','Stock Associate']::text[]),
    ('57d00000-0000-4000-8000-000000000009'::uuid,'Isabella Chen',17,'female','Seacoast Collegiate High School',4.0,'115 S Wall St, Inlet Beach, FL','32461','isabella-chen@seed.simplyapply.test','8505550109',
     ARRAY['Thursday','Friday','Saturday']::text[],'3:00 PM','10:00 PM','7','night',ARRAY['Art','Photography','School']::text[],ARRAY['Ice Cream Scooper','Sales Associate','Customer Service']::text[]),
    ('57d00000-0000-4000-8000-000000000010'::uuid,'Mason Webb',20,'male','Northwest Florida State College',3.0,'112 Seascape Dr, Miramar Beach, FL','32550','mason-webb@seed.simplyapply.test','8505550110',
     ARRAY['Tuesday','Wednesday','Thursday','Friday']::text[],'5:00 AM','12:00 PM','7','morning',ARRAY['Fitness','Outdoors']::text[],ARRAY['Lifeguard','Car Detailer','Cook']::text[]),
    ('57d00000-0000-4000-8000-000000000011'::uuid,'Lily Patterson',14,'female','Emerald Coast Middle School',3.7,'42 Clayton Ln, Inlet Beach, FL','32461','lily-patterson@seed.simplyapply.test','8505550111',
     ARRAY['Friday','Saturday','Sunday']::text[],'10:00 AM','10:00 PM','12','flexible',ARRAY['Reading','Music','Volunteering']::text[],ARRAY['Ice Cream Scooper','Bagger','Library Assistant']::text[]),
    ('57d00000-0000-4000-8000-000000000012'::uuid,'Noah Fitzgerald',18,'male','Walton High School',2.7,'503 Hwy 20 E, Freeport, FL','32439','noah-fitzgerald@seed.simplyapply.test','8505550112',
     ARRAY['Monday','Tuesday','Wednesday','Thursday','Friday']::text[],'4:30 PM','11:00 PM','6.5','night',ARRAY['Gaming','Cooking']::text[],ARRAY['Cook','Dishwasher','Food Runner']::text[]),
    ('57d00000-0000-4000-8000-000000000013'::uuid,'Zoe Carter',16,'female','South Walton High School',3.5,'303 Live Oak Ave, DeFuniak Springs, FL','32435','zoe-carter@seed.simplyapply.test','8505550113',
     ARRAY['Saturday','Sunday']::text[],'10:00 AM','10:00 PM','12','flexible',ARRAY['Photography','Art','Fitness']::text[],ARRAY['Barista','Customer Service','Host/Hostess']::text[]),
    ('57d00000-0000-4000-8000-000000000014'::uuid,'Owen Mitchell',17,'male','Walton High School',3.2,'88 Circle Dr, DeFuniak Springs, FL','32435','owen-mitchell@seed.simplyapply.test','8505550114',
     ARRAY['Friday','Saturday','Sunday']::text[],'3:00 PM','10:00 PM','7','night',ARRAY['Sports','Outdoors','School']::text[],ARRAY['Busser','Server','Cart Attendant']::text[]),
    ('57d00000-0000-4000-8000-000000000015'::uuid,'Grace Sullivan',21,'female','Northwest Florida State College',3.9,'120 Winston Manor Rd, Santa Rosa Beach, FL','32459','grace-sullivan@seed.simplyapply.test','8505550115',
     ARRAY['Monday','Tuesday','Wednesday','Thursday','Friday']::text[],'6:00 AM','2:00 PM','8','morning',ARRAY['Volunteering','Reading','Cooking']::text[],ARRAY['Tutor','Office Assistant','Front Desk']::text[])
) as s(user_id, name, age, gender, school, gpa, location, zip_code, email, phone,
       days, win_start, win_end, win_hours, pref, interests, preferred_jobs);

-- 4. distances --------------------------------------------------------------
--    Real driving distances from Google against the locations you have now.
--    Add a location later and these will not cover it: open that location in
--    the dashboard and save it again to recalculate.
insert into employer_student_distances (
  employer_location_id, student_user_id, distance_meters, distance_text, duration_text, calculated_at
)
select s.loc, s.stu, s.m, s.dt, s.du, now()
from (values
    ('e05a0dbb-d7ed-43d8-a160-090d92cad228'::uuid,'57d00000-0000-4000-8000-000000000001'::uuid,27663,'17.2 mi','24 mins'),
    ('6aa60342-19be-425f-9672-fca2a499eefd'::uuid,'57d00000-0000-4000-8000-000000000001'::uuid,15723,'9.8 mi','16 mins'),
    ('38fd633a-f200-4303-afb1-eb9979c55fc1'::uuid,'57d00000-0000-4000-8000-000000000001'::uuid,15676,'9.7 mi','16 mins'),
    ('944661f2-7e19-4e80-a056-9031487b3bac'::uuid,'57d00000-0000-4000-8000-000000000001'::uuid,18676,'11.6 mi','21 mins'),
    ('e05a0dbb-d7ed-43d8-a160-090d92cad228'::uuid,'57d00000-0000-4000-8000-000000000002'::uuid,10777,'6.7 mi','15 mins'),
    ('6aa60342-19be-425f-9672-fca2a499eefd'::uuid,'57d00000-0000-4000-8000-000000000002'::uuid,6068,'3.8 mi','11 mins'),
    ('38fd633a-f200-4303-afb1-eb9979c55fc1'::uuid,'57d00000-0000-4000-8000-000000000002'::uuid,6298,'3.9 mi','12 mins'),
    ('944661f2-7e19-4e80-a056-9031487b3bac'::uuid,'57d00000-0000-4000-8000-000000000002'::uuid,2957,'1.8 mi','5 mins'),
    ('e05a0dbb-d7ed-43d8-a160-090d92cad228'::uuid,'57d00000-0000-4000-8000-000000000003'::uuid,27663,'17.2 mi','24 mins'),
    ('6aa60342-19be-425f-9672-fca2a499eefd'::uuid,'57d00000-0000-4000-8000-000000000003'::uuid,12304,'7.6 mi','15 mins'),
    ('38fd633a-f200-4303-afb1-eb9979c55fc1'::uuid,'57d00000-0000-4000-8000-000000000003'::uuid,12257,'7.6 mi','14 mins'),
    ('944661f2-7e19-4e80-a056-9031487b3bac'::uuid,'57d00000-0000-4000-8000-000000000003'::uuid,9694,'6.0 mi','18 mins'),
    ('e05a0dbb-d7ed-43d8-a160-090d92cad228'::uuid,'57d00000-0000-4000-8000-000000000004'::uuid,7778,'4.8 mi','12 mins'),
    ('6aa60342-19be-425f-9672-fca2a499eefd'::uuid,'57d00000-0000-4000-8000-000000000004'::uuid,8220,'5.1 mi','14 mins'),
    ('38fd633a-f200-4303-afb1-eb9979c55fc1'::uuid,'57d00000-0000-4000-8000-000000000004'::uuid,8450,'5.3 mi','15 mins'),
    ('944661f2-7e19-4e80-a056-9031487b3bac'::uuid,'57d00000-0000-4000-8000-000000000004'::uuid,5109,'3.2 mi','8 mins'),
    ('e05a0dbb-d7ed-43d8-a160-090d92cad228'::uuid,'57d00000-0000-4000-8000-000000000005'::uuid,27663,'17.2 mi','24 mins'),
    ('6aa60342-19be-425f-9672-fca2a499eefd'::uuid,'57d00000-0000-4000-8000-000000000005'::uuid,15723,'9.8 mi','16 mins'),
    ('38fd633a-f200-4303-afb1-eb9979c55fc1'::uuid,'57d00000-0000-4000-8000-000000000005'::uuid,15676,'9.7 mi','16 mins'),
    ('944661f2-7e19-4e80-a056-9031487b3bac'::uuid,'57d00000-0000-4000-8000-000000000005'::uuid,18676,'11.6 mi','21 mins'),
    ('e05a0dbb-d7ed-43d8-a160-090d92cad228'::uuid,'57d00000-0000-4000-8000-000000000006'::uuid,54897,'34.1 mi','44 mins'),
    ('6aa60342-19be-425f-9672-fca2a499eefd'::uuid,'57d00000-0000-4000-8000-000000000006'::uuid,42957,'26.7 mi','37 mins'),
    ('38fd633a-f200-4303-afb1-eb9979c55fc1'::uuid,'57d00000-0000-4000-8000-000000000006'::uuid,42910,'26.7 mi','36 mins'),
    ('944661f2-7e19-4e80-a056-9031487b3bac'::uuid,'57d00000-0000-4000-8000-000000000006'::uuid,45910,'28.5 mi','41 mins'),
    ('e05a0dbb-d7ed-43d8-a160-090d92cad228'::uuid,'57d00000-0000-4000-8000-000000000007'::uuid,36502,'22.7 mi','33 mins'),
    ('6aa60342-19be-425f-9672-fca2a499eefd'::uuid,'57d00000-0000-4000-8000-000000000007'::uuid,24563,'15.3 mi','25 mins'),
    ('38fd633a-f200-4303-afb1-eb9979c55fc1'::uuid,'57d00000-0000-4000-8000-000000000007'::uuid,24516,'15.2 mi','25 mins'),
    ('944661f2-7e19-4e80-a056-9031487b3bac'::uuid,'57d00000-0000-4000-8000-000000000007'::uuid,27516,'17.1 mi','30 mins'),
    ('e05a0dbb-d7ed-43d8-a160-090d92cad228'::uuid,'57d00000-0000-4000-8000-000000000008'::uuid,27663,'17.2 mi','24 mins'),
    ('6aa60342-19be-425f-9672-fca2a499eefd'::uuid,'57d00000-0000-4000-8000-000000000008'::uuid,15723,'9.8 mi','16 mins'),
    ('38fd633a-f200-4303-afb1-eb9979c55fc1'::uuid,'57d00000-0000-4000-8000-000000000008'::uuid,15676,'9.7 mi','16 mins'),
    ('944661f2-7e19-4e80-a056-9031487b3bac'::uuid,'57d00000-0000-4000-8000-000000000008'::uuid,18676,'11.6 mi','21 mins'),
    ('e05a0dbb-d7ed-43d8-a160-090d92cad228'::uuid,'57d00000-0000-4000-8000-000000000009'::uuid,755,'0.5 mi','3 mins'),
    ('6aa60342-19be-425f-9672-fca2a499eefd'::uuid,'57d00000-0000-4000-8000-000000000009'::uuid,19508,'12.1 mi','18 mins'),
    ('38fd633a-f200-4303-afb1-eb9979c55fc1'::uuid,'57d00000-0000-4000-8000-000000000009'::uuid,19461,'12.1 mi','18 mins'),
    ('944661f2-7e19-4e80-a056-9031487b3bac'::uuid,'57d00000-0000-4000-8000-000000000009'::uuid,13025,'8.1 mi','19 mins'),
    ('e05a0dbb-d7ed-43d8-a160-090d92cad228'::uuid,'57d00000-0000-4000-8000-000000000010'::uuid,38818,'24.1 mi','37 mins'),
    ('6aa60342-19be-425f-9672-fca2a499eefd'::uuid,'57d00000-0000-4000-8000-000000000010'::uuid,26878,'16.7 mi','29 mins'),
    ('38fd633a-f200-4303-afb1-eb9979c55fc1'::uuid,'57d00000-0000-4000-8000-000000000010'::uuid,26831,'16.7 mi','29 mins'),
    ('944661f2-7e19-4e80-a056-9031487b3bac'::uuid,'57d00000-0000-4000-8000-000000000010'::uuid,29832,'18.5 mi','34 mins'),
    ('e05a0dbb-d7ed-43d8-a160-090d92cad228'::uuid,'57d00000-0000-4000-8000-000000000011'::uuid,742,'0.5 mi','3 mins'),
    ('6aa60342-19be-425f-9672-fca2a499eefd'::uuid,'57d00000-0000-4000-8000-000000000011'::uuid,19495,'12.1 mi','17 mins'),
    ('38fd633a-f200-4303-afb1-eb9979c55fc1'::uuid,'57d00000-0000-4000-8000-000000000011'::uuid,19448,'12.1 mi','17 mins'),
    ('944661f2-7e19-4e80-a056-9031487b3bac'::uuid,'57d00000-0000-4000-8000-000000000011'::uuid,13013,'8.1 mi','18 mins'),
    ('e05a0dbb-d7ed-43d8-a160-090d92cad228'::uuid,'57d00000-0000-4000-8000-000000000012'::uuid,38586,'24.0 mi','32 mins'),
    ('6aa60342-19be-425f-9672-fca2a499eefd'::uuid,'57d00000-0000-4000-8000-000000000012'::uuid,26646,'16.6 mi','24 mins'),
    ('38fd633a-f200-4303-afb1-eb9979c55fc1'::uuid,'57d00000-0000-4000-8000-000000000012'::uuid,26599,'16.5 mi','24 mins'),
    ('944661f2-7e19-4e80-a056-9031487b3bac'::uuid,'57d00000-0000-4000-8000-000000000012'::uuid,29600,'18.4 mi','29 mins'),
    ('e05a0dbb-d7ed-43d8-a160-090d92cad228'::uuid,'57d00000-0000-4000-8000-000000000013'::uuid,62504,'38.8 mi','47 mins'),
    ('6aa60342-19be-425f-9672-fca2a499eefd'::uuid,'57d00000-0000-4000-8000-000000000013'::uuid,50564,'31.4 mi','40 mins'),
    ('38fd633a-f200-4303-afb1-eb9979c55fc1'::uuid,'57d00000-0000-4000-8000-000000000013'::uuid,50517,'31.4 mi','39 mins'),
    ('944661f2-7e19-4e80-a056-9031487b3bac'::uuid,'57d00000-0000-4000-8000-000000000013'::uuid,53517,'33.3 mi','44 mins'),
    ('e05a0dbb-d7ed-43d8-a160-090d92cad228'::uuid,'57d00000-0000-4000-8000-000000000014'::uuid,62336,'38.7 mi','48 mins'),
    ('6aa60342-19be-425f-9672-fca2a499eefd'::uuid,'57d00000-0000-4000-8000-000000000014'::uuid,50396,'31.3 mi','41 mins'),
    ('38fd633a-f200-4303-afb1-eb9979c55fc1'::uuid,'57d00000-0000-4000-8000-000000000014'::uuid,50350,'31.3 mi','40 mins'),
    ('944661f2-7e19-4e80-a056-9031487b3bac'::uuid,'57d00000-0000-4000-8000-000000000014'::uuid,53350,'33.2 mi','45 mins'),
    ('e05a0dbb-d7ed-43d8-a160-090d92cad228'::uuid,'57d00000-0000-4000-8000-000000000015'::uuid,28608,'17.8 mi','24 mins'),
    ('6aa60342-19be-425f-9672-fca2a499eefd'::uuid,'57d00000-0000-4000-8000-000000000015'::uuid,16668,'10.4 mi','16 mins'),
    ('38fd633a-f200-4303-afb1-eb9979c55fc1'::uuid,'57d00000-0000-4000-8000-000000000015'::uuid,16622,'10.3 mi','16 mins'),
    ('944661f2-7e19-4e80-a056-9031487b3bac'::uuid,'57d00000-0000-4000-8000-000000000015'::uuid,19622,'12.2 mi','21 mins')
) as s(loc, stu, m, dt, du);

-- ---------------------------------------------------------------------------
-- Expect: 15 | 15 | 60
select
  (select count(*) from auth.users where email like '%@seed.simplyapply.test') as seed_users,
  (select count(*) from "Students" where email like '%@seed.simplyapply.test') as seed_students,
  (select count(*) from employer_student_distances where student_user_id in
     (select id from auth.users where email like '%@seed.simplyapply.test'))   as distance_rows;

commit;
-- rollback;  -- use this instead if the counts look wrong
