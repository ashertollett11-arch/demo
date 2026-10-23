-- ===========================================================================
--  SimplyApply - seed a full lineup of test employers and locations
-- ===========================================================================
--  10 employers / 17 locations around Walton County.
--
--  Every row is tagged by the email domain @seed.simplyapply.test, which is what
--  the teardown script matches on. Nothing real shares that domain.
--
--  EMAIL IS OFF for all of these:
--    * email_notifications / email_hiring / email_other = false
--    * profile_complete = true, so the daily reminder sweep skips them
--    * pro_paywall_hits = 0, so the Pro value sweep never picks them up
--    * the domain is .test, which cannot be delivered to even if one escaped
--
--  4 employers are Pro ('active') so all their locations stay visible.
--  Grayton Beach Coffee is deliberately Free WITH 2 locations, so its newer
--  one should be hidden from students - that is the free-plan gate working.
--
--  Wrapped in a transaction: check the counts at the bottom, then COMMIT.
-- ===========================================================================

begin;

-- 1. auth users ------------------------------------------------------------
--    Seed accounts only. The password hash is a placeholder and these are
--    not meant to be logged into.
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
    ('5eed0000-0000-4000-8000-000000000001'::uuid, 'grayton-beach-coffee@seed.simplyapply.test'),
    ('5eed0000-0000-4000-8000-000000000002'::uuid, 'seaside-scoops@seed.simplyapply.test'),
    ('5eed0000-0000-4000-8000-000000000003'::uuid, 'rosemary-surf-and-sport@seed.simplyapply.test'),
    ('5eed0000-0000-4000-8000-000000000004'::uuid, 'watercolor-bike-rentals@seed.simplyapply.test'),
    ('5eed0000-0000-4000-8000-000000000005'::uuid, 'silver-sands-outfitters@seed.simplyapply.test'),
    ('5eed0000-0000-4000-8000-000000000006'::uuid, 'bayou-burger-co@seed.simplyapply.test'),
    ('5eed0000-0000-4000-8000-000000000007'::uuid, 'emerald-coast-car-wash@seed.simplyapply.test'),
    ('5eed0000-0000-4000-8000-000000000008'::uuid, 'defuniak-public-library@seed.simplyapply.test'),
    ('5eed0000-0000-4000-8000-000000000009'::uuid, 'santa-rosa-golf-and-beach-club@seed.simplyapply.test'),
    ('5eed0000-0000-4000-8000-000000000010'::uuid, 'blue-mountain-market@seed.simplyapply.test')
) as s(id, email);

-- 2. role rows -------------------------------------------------------------
insert into users (id, role)
values
    ('5eed0000-0000-4000-8000-000000000001'::uuid, 'employer'),
    ('5eed0000-0000-4000-8000-000000000002'::uuid, 'employer'),
    ('5eed0000-0000-4000-8000-000000000003'::uuid, 'employer'),
    ('5eed0000-0000-4000-8000-000000000004'::uuid, 'employer'),
    ('5eed0000-0000-4000-8000-000000000005'::uuid, 'employer'),
    ('5eed0000-0000-4000-8000-000000000006'::uuid, 'employer'),
    ('5eed0000-0000-4000-8000-000000000007'::uuid, 'employer'),
    ('5eed0000-0000-4000-8000-000000000008'::uuid, 'employer'),
    ('5eed0000-0000-4000-8000-000000000009'::uuid, 'employer'),
    ('5eed0000-0000-4000-8000-000000000010'::uuid, 'employer');

-- 3. profiles (plan + email switched off) -----------------------------------
insert into profiles (id, email, subscription_status, profile_complete,
                      email_notifications, email_hiring, email_other, pro_paywall_hits)
select s.id, s.email, s.plan, true, false, false, false, 0
from (values
    ('5eed0000-0000-4000-8000-000000000001'::uuid, 'grayton-beach-coffee@seed.simplyapply.test', 'freeactive'),
    ('5eed0000-0000-4000-8000-000000000002'::uuid, 'seaside-scoops@seed.simplyapply.test', 'active'),
    ('5eed0000-0000-4000-8000-000000000003'::uuid, 'rosemary-surf-and-sport@seed.simplyapply.test', 'freeactive'),
    ('5eed0000-0000-4000-8000-000000000004'::uuid, 'watercolor-bike-rentals@seed.simplyapply.test', 'freeactive'),
    ('5eed0000-0000-4000-8000-000000000005'::uuid, 'silver-sands-outfitters@seed.simplyapply.test', 'active'),
    ('5eed0000-0000-4000-8000-000000000006'::uuid, 'bayou-burger-co@seed.simplyapply.test', 'freeactive'),
    ('5eed0000-0000-4000-8000-000000000007'::uuid, 'emerald-coast-car-wash@seed.simplyapply.test', 'active'),
    ('5eed0000-0000-4000-8000-000000000008'::uuid, 'defuniak-public-library@seed.simplyapply.test', 'freeactive'),
    ('5eed0000-0000-4000-8000-000000000009'::uuid, 'santa-rosa-golf-and-beach-club@seed.simplyapply.test', 'active'),
    ('5eed0000-0000-4000-8000-000000000010'::uuid, 'blue-mountain-market@seed.simplyapply.test', 'freeactive')
) as s(id, email, plan);

-- 4. companies --------------------------------------------------------------
insert into job (id, user_id, company, title, business_type, owner_name, phone, email,
                 status, shift_preference, has_tips, preferred_jobs, distance, zip_match_precision)
select s.id, s.user_id, s.company, s.company, s.btype, s.owner, s.phone, s.email,
       'new', 'flexible', false, '[]'::jsonb, '0', 5
from (values
    ('30b00000-0000-4000-8000-000000000001'::uuid, '5eed0000-0000-4000-8000-000000000001'::uuid, 'Grayton Beach Coffee', 'Food Service', 'Dana Whitfield', '8505550118', 'grayton-beach-coffee@seed.simplyapply.test'),
    ('30b00000-0000-4000-8000-000000000002'::uuid, '5eed0000-0000-4000-8000-000000000002'::uuid, 'Seaside Scoops', 'Ice Cream', 'Marcus Hale', '8505550214', 'seaside-scoops@seed.simplyapply.test'),
    ('30b00000-0000-4000-8000-000000000003'::uuid, '5eed0000-0000-4000-8000-000000000003'::uuid, 'Rosemary Surf and Sport', 'Retail', 'Priya Raman', '8505550337', 'rosemary-surf-and-sport@seed.simplyapply.test'),
    ('30b00000-0000-4000-8000-000000000004'::uuid, '5eed0000-0000-4000-8000-000000000004'::uuid, 'WaterColor Bike Rentals', 'Recreation', 'Tyler Boone', '8505550492', 'watercolor-bike-rentals@seed.simplyapply.test'),
    ('30b00000-0000-4000-8000-000000000005'::uuid, '5eed0000-0000-4000-8000-000000000005'::uuid, 'Silver Sands Outfitters', 'Retail', 'Jenna Cole', '8505550556', 'silver-sands-outfitters@seed.simplyapply.test'),
    ('30b00000-0000-4000-8000-000000000006'::uuid, '5eed0000-0000-4000-8000-000000000006'::uuid, 'Bayou Burger Co', 'Food Service', 'Rick Alvarez', '8505550671', 'bayou-burger-co@seed.simplyapply.test'),
    ('30b00000-0000-4000-8000-000000000007'::uuid, '5eed0000-0000-4000-8000-000000000007'::uuid, 'Emerald Coast Car Wash', 'Automotive', 'Sam Ortiz', '8505550744', 'emerald-coast-car-wash@seed.simplyapply.test'),
    ('30b00000-0000-4000-8000-000000000008'::uuid, '5eed0000-0000-4000-8000-000000000008'::uuid, 'DeFuniak Public Library', 'Education', 'Helen Marsh', '8505550803', 'defuniak-public-library@seed.simplyapply.test'),
    ('30b00000-0000-4000-8000-000000000009'::uuid, '5eed0000-0000-4000-8000-000000000009'::uuid, 'Santa Rosa Golf and Beach Club', 'Recreation', 'Grant Webb', '8505550929', 'santa-rosa-golf-and-beach-club@seed.simplyapply.test'),
    ('30b00000-0000-4000-8000-000000000010'::uuid, '5eed0000-0000-4000-8000-000000000010'::uuid, 'Blue Mountain Market', 'Retail', 'Noor Haddad', '8505551046', 'blue-mountain-market@seed.simplyapply.test')
) as s(id, user_id, company, btype, owner, phone, email);

-- 5. locations ---------------------------------------------------------------
--    created_at is staggered so "oldest location" is deterministic for the
--    free-plan gate rather than depending on insert order.
insert into locations (id, employer_id, name, address, zip_code, available_shifts,
                       shift_preference, hourly_pay, has_tips, preferred_jobs,
                       max_distance_miles, created_at)
values
    ('10ca0000-0000-4000-8000-000000000001'::uuid, '30b00000-0000-4000-8000-000000000001'::uuid, 'Grayton Main', '58 Logan Ln', '32459',
     '[{"day": "Monday", "start": "6:00 AM", "end": "2:00 PM", "active": true}, {"day": "Tuesday", "start": "6:00 AM", "end": "2:00 PM", "active": true}, {"day": "Wednesday", "start": "6:00 AM", "end": "2:00 PM", "active": true}, {"day": "Thursday", "start": "6:00 AM", "end": "2:00 PM", "active": true}, {"day": "Friday", "start": "6:00 AM", "end": "2:00 PM", "active": true}, {"day": "Saturday", "start": "6:00 AM", "end": "2:00 PM", "active": false}, {"day": "Sunday", "start": "6:00 AM", "end": "2:00 PM", "active": false}]'::jsonb,
     'morning', 13.5, true, '["Barista", "Cashier", "Busser"]'::jsonb, 10, now() - interval '40 days'),
    ('10ca0000-0000-4000-8000-000000000002'::uuid, '30b00000-0000-4000-8000-000000000001'::uuid, 'Blue Mountain Kiosk', '2217 S County Hwy 83', '32459',
     '[{"day": "Monday", "start": "10:00 AM", "end": "6:00 PM", "active": false}, {"day": "Tuesday", "start": "10:00 AM", "end": "6:00 PM", "active": false}, {"day": "Wednesday", "start": "10:00 AM", "end": "6:00 PM", "active": false}, {"day": "Thursday", "start": "10:00 AM", "end": "6:00 PM", "active": false}, {"day": "Friday", "start": "10:00 AM", "end": "6:00 PM", "active": false}, {"day": "Saturday", "start": "10:00 AM", "end": "6:00 PM", "active": true}, {"day": "Sunday", "start": "10:00 AM", "end": "6:00 PM", "active": true}]'::jsonb,
     'flexible', 13.0, true, '["Barista", "Cashier"]'::jsonb, 10, now() - interval '12 days'),
    ('10ca0000-0000-4000-8000-000000000003'::uuid, '30b00000-0000-4000-8000-000000000002'::uuid, 'Seaside Central', '25 Central Sq', '32459',
     '[{"day": "Monday", "start": "4:00 PM", "end": "10:00 PM", "active": false}, {"day": "Tuesday", "start": "4:00 PM", "end": "10:00 PM", "active": false}, {"day": "Wednesday", "start": "4:00 PM", "end": "10:00 PM", "active": false}, {"day": "Thursday", "start": "4:00 PM", "end": "10:00 PM", "active": true}, {"day": "Friday", "start": "4:00 PM", "end": "10:00 PM", "active": true}, {"day": "Saturday", "start": "4:00 PM", "end": "10:00 PM", "active": true}, {"day": "Sunday", "start": "4:00 PM", "end": "10:00 PM", "active": true}]'::jsonb,
     'night', 12.5, true, '["Ice Cream Scooper", "Cashier", "Customer Service"]'::jsonb, 15, now() - interval '38 days'),
    ('10ca0000-0000-4000-8000-000000000004'::uuid, '30b00000-0000-4000-8000-000000000002'::uuid, 'Rosemary Green', '78 Main St', '32461',
     '[{"day": "Monday", "start": "12:00 PM", "end": "8:00 PM", "active": false}, {"day": "Tuesday", "start": "12:00 PM", "end": "8:00 PM", "active": false}, {"day": "Wednesday", "start": "12:00 PM", "end": "8:00 PM", "active": false}, {"day": "Thursday", "start": "12:00 PM", "end": "8:00 PM", "active": false}, {"day": "Friday", "start": "12:00 PM", "end": "8:00 PM", "active": true}, {"day": "Saturday", "start": "12:00 PM", "end": "8:00 PM", "active": true}, {"day": "Sunday", "start": "12:00 PM", "end": "8:00 PM", "active": true}]'::jsonb,
     'flexible', 12.5, true, '["Ice Cream Scooper", "Cashier"]'::jsonb, 15, now() - interval '30 days'),
    ('10ca0000-0000-4000-8000-000000000005'::uuid, '30b00000-0000-4000-8000-000000000002'::uuid, 'Alys Scoop Shop', '9 N Charles St', '32461',
     '[{"day": "Monday", "start": "10:00 AM", "end": "6:00 PM", "active": false}, {"day": "Tuesday", "start": "10:00 AM", "end": "6:00 PM", "active": false}, {"day": "Wednesday", "start": "10:00 AM", "end": "6:00 PM", "active": false}, {"day": "Thursday", "start": "10:00 AM", "end": "6:00 PM", "active": false}, {"day": "Friday", "start": "10:00 AM", "end": "6:00 PM", "active": false}, {"day": "Saturday", "start": "10:00 AM", "end": "6:00 PM", "active": true}, {"day": "Sunday", "start": "10:00 AM", "end": "6:00 PM", "active": true}]'::jsonb,
     'flexible', 13.0, true, '["Ice Cream Scooper", "Customer Service"]'::jsonb, 12, now() - interval '22 days'),
    ('10ca0000-0000-4000-8000-000000000006'::uuid, '30b00000-0000-4000-8000-000000000003'::uuid, 'Rosemary Beach', '104 N Barrett Sq', '32461',
     '[{"day": "Monday", "start": "10:00 AM", "end": "6:00 PM", "active": true}, {"day": "Tuesday", "start": "10:00 AM", "end": "6:00 PM", "active": true}, {"day": "Wednesday", "start": "10:00 AM", "end": "6:00 PM", "active": true}, {"day": "Thursday", "start": "10:00 AM", "end": "6:00 PM", "active": true}, {"day": "Friday", "start": "10:00 AM", "end": "6:00 PM", "active": true}, {"day": "Saturday", "start": "10:00 AM", "end": "6:00 PM", "active": true}, {"day": "Sunday", "start": "10:00 AM", "end": "6:00 PM", "active": true}]'::jsonb,
     'flexible', 14.0, false, '["Sales Associate", "Stock Associate", "Customer Service"]'::jsonb, 20, now() - interval '34 days'),
    ('10ca0000-0000-4000-8000-000000000007'::uuid, '30b00000-0000-4000-8000-000000000004'::uuid, 'WaterColor Depot', '1777 W Scenic Hwy 30A', '32459',
     '[{"day": "Monday", "start": "8:00 AM", "end": "4:00 PM", "active": true}, {"day": "Tuesday", "start": "8:00 AM", "end": "4:00 PM", "active": true}, {"day": "Wednesday", "start": "8:00 AM", "end": "4:00 PM", "active": true}, {"day": "Thursday", "start": "8:00 AM", "end": "4:00 PM", "active": true}, {"day": "Friday", "start": "8:00 AM", "end": "4:00 PM", "active": true}, {"day": "Saturday", "start": "8:00 AM", "end": "4:00 PM", "active": true}, {"day": "Sunday", "start": "8:00 AM", "end": "4:00 PM", "active": false}]'::jsonb,
     'morning', 14.5, false, '["Customer Service", "Cart Attendant", "Cashier"]'::jsonb, 15, now() - interval '28 days'),
    ('10ca0000-0000-4000-8000-000000000008'::uuid, '30b00000-0000-4000-8000-000000000005'::uuid, 'Outlet North', '10562 Emerald Coast Pkwy', '32550',
     '[{"day": "Monday", "start": "10:00 AM", "end": "6:00 PM", "active": true}, {"day": "Tuesday", "start": "10:00 AM", "end": "6:00 PM", "active": true}, {"day": "Wednesday", "start": "10:00 AM", "end": "6:00 PM", "active": true}, {"day": "Thursday", "start": "10:00 AM", "end": "6:00 PM", "active": true}, {"day": "Friday", "start": "10:00 AM", "end": "6:00 PM", "active": true}, {"day": "Saturday", "start": "10:00 AM", "end": "6:00 PM", "active": true}, {"day": "Sunday", "start": "10:00 AM", "end": "6:00 PM", "active": true}]'::jsonb,
     'flexible', 15.0, false, '["Sales Associate", "Stock Associate", "Fitting Room Attendant"]'::jsonb, 25, now() - interval '36 days'),
    ('10ca0000-0000-4000-8000-000000000009'::uuid, '30b00000-0000-4000-8000-000000000005'::uuid, 'Outlet South', '10406 Emerald Coast Pkwy', '32550',
     '[{"day": "Monday", "start": "3:00 PM", "end": "8:00 PM", "active": true}, {"day": "Tuesday", "start": "3:00 PM", "end": "8:00 PM", "active": false}, {"day": "Wednesday", "start": "3:00 PM", "end": "8:00 PM", "active": true}, {"day": "Thursday", "start": "3:00 PM", "end": "8:00 PM", "active": false}, {"day": "Friday", "start": "3:00 PM", "end": "8:00 PM", "active": true}, {"day": "Saturday", "start": "3:00 PM", "end": "8:00 PM", "active": false}, {"day": "Sunday", "start": "3:00 PM", "end": "8:00 PM", "active": false}]'::jsonb,
     'night', 14.0, false, '["Sales Associate", "Cashier"]'::jsonb, 25, now() - interval '24 days'),
    ('10ca0000-0000-4000-8000-000000000010'::uuid, '30b00000-0000-4000-8000-000000000005'::uuid, 'Grand Boulevard', '495 Grand Blvd', '32550',
     '[{"day": "Monday", "start": "9:00 AM", "end": "5:00 PM", "active": false}, {"day": "Tuesday", "start": "9:00 AM", "end": "5:00 PM", "active": true}, {"day": "Wednesday", "start": "9:00 AM", "end": "5:00 PM", "active": true}, {"day": "Thursday", "start": "9:00 AM", "end": "5:00 PM", "active": true}, {"day": "Friday", "start": "9:00 AM", "end": "5:00 PM", "active": true}, {"day": "Saturday", "start": "9:00 AM", "end": "5:00 PM", "active": true}, {"day": "Sunday", "start": "9:00 AM", "end": "5:00 PM", "active": false}]'::jsonb,
     'flexible', 15.5, false, '["Sales Associate", "Stock Associate", "Customer Service"]'::jsonb, 20, now() - interval '16 days'),
    ('10ca0000-0000-4000-8000-000000000011'::uuid, '30b00000-0000-4000-8000-000000000006'::uuid, 'Freeport Bayou', '15396 US-331 Business', '32439',
     '[{"day": "Monday", "start": "4:00 PM", "end": "10:00 PM", "active": false}, {"day": "Tuesday", "start": "4:00 PM", "end": "10:00 PM", "active": false}, {"day": "Wednesday", "start": "4:00 PM", "end": "10:00 PM", "active": false}, {"day": "Thursday", "start": "4:00 PM", "end": "10:00 PM", "active": true}, {"day": "Friday", "start": "4:00 PM", "end": "10:00 PM", "active": true}, {"day": "Saturday", "start": "4:00 PM", "end": "10:00 PM", "active": true}, {"day": "Sunday", "start": "4:00 PM", "end": "10:00 PM", "active": true}]'::jsonb,
     'night', 14.0, true, '["Cook", "Cashier", "Food Runner", "Dishwasher"]'::jsonb, 20, now() - interval '26 days'),
    ('10ca0000-0000-4000-8000-000000000012'::uuid, '30b00000-0000-4000-8000-000000000007'::uuid, 'Back Beach Road', '17554 Panama City Beach Pkwy', '32413',
     '[{"day": "Monday", "start": "8:00 AM", "end": "4:00 PM", "active": true}, {"day": "Tuesday", "start": "8:00 AM", "end": "4:00 PM", "active": true}, {"day": "Wednesday", "start": "8:00 AM", "end": "4:00 PM", "active": true}, {"day": "Thursday", "start": "8:00 AM", "end": "4:00 PM", "active": true}, {"day": "Friday", "start": "8:00 AM", "end": "4:00 PM", "active": true}, {"day": "Saturday", "start": "8:00 AM", "end": "4:00 PM", "active": true}, {"day": "Sunday", "start": "8:00 AM", "end": "4:00 PM", "active": false}]'::jsonb,
     'morning', 15.0, false, '["Car Wash Attendant", "Car Detailer", "Cashier"]'::jsonb, 25, now() - interval '32 days'),
    ('10ca0000-0000-4000-8000-000000000013'::uuid, '30b00000-0000-4000-8000-000000000007'::uuid, 'Miramar Plaza', '12273 Emerald Coast Pkwy', '32550',
     '[{"day": "Monday", "start": "10:00 AM", "end": "6:00 PM", "active": false}, {"day": "Tuesday", "start": "10:00 AM", "end": "6:00 PM", "active": false}, {"day": "Wednesday", "start": "10:00 AM", "end": "6:00 PM", "active": false}, {"day": "Thursday", "start": "10:00 AM", "end": "6:00 PM", "active": false}, {"day": "Friday", "start": "10:00 AM", "end": "6:00 PM", "active": false}, {"day": "Saturday", "start": "10:00 AM", "end": "6:00 PM", "active": true}, {"day": "Sunday", "start": "10:00 AM", "end": "6:00 PM", "active": true}]'::jsonb,
     'flexible', 15.5, false, '["Car Wash Attendant", "Car Detailer"]'::jsonb, 25, now() - interval '18 days'),
    ('10ca0000-0000-4000-8000-000000000014'::uuid, '30b00000-0000-4000-8000-000000000008'::uuid, 'DeFuniak Main', '3 Circle Dr', '32435',
     '[{"day": "Monday", "start": "3:00 PM", "end": "8:00 PM", "active": true}, {"day": "Tuesday", "start": "3:00 PM", "end": "8:00 PM", "active": false}, {"day": "Wednesday", "start": "3:00 PM", "end": "8:00 PM", "active": true}, {"day": "Thursday", "start": "3:00 PM", "end": "8:00 PM", "active": false}, {"day": "Friday", "start": "3:00 PM", "end": "8:00 PM", "active": true}, {"day": "Saturday", "start": "3:00 PM", "end": "8:00 PM", "active": false}, {"day": "Sunday", "start": "3:00 PM", "end": "8:00 PM", "active": false}]'::jsonb,
     'night', 12.0, false, '["Library Assistant", "Office Assistant", "Tutor"]'::jsonb, 25, now() - interval '20 days'),
    ('10ca0000-0000-4000-8000-000000000015'::uuid, '30b00000-0000-4000-8000-000000000009'::uuid, 'Clubhouse', '1 Clubhouse Dr', '32459',
     '[{"day": "Monday", "start": "8:00 AM", "end": "4:00 PM", "active": true}, {"day": "Tuesday", "start": "8:00 AM", "end": "4:00 PM", "active": true}, {"day": "Wednesday", "start": "8:00 AM", "end": "4:00 PM", "active": true}, {"day": "Thursday", "start": "8:00 AM", "end": "4:00 PM", "active": true}, {"day": "Friday", "start": "8:00 AM", "end": "4:00 PM", "active": true}, {"day": "Saturday", "start": "8:00 AM", "end": "4:00 PM", "active": true}, {"day": "Sunday", "start": "8:00 AM", "end": "4:00 PM", "active": false}]'::jsonb,
     'morning', 14.5, true, '["Front Desk", "Customer Service", "Cart Attendant"]'::jsonb, 15, now() - interval '30 days'),
    ('10ca0000-0000-4000-8000-000000000016'::uuid, '30b00000-0000-4000-8000-000000000009'::uuid, 'Beach Grill', '3269 W Scenic Hwy 30A', '32459',
     '[{"day": "Monday", "start": "4:00 PM", "end": "10:00 PM", "active": false}, {"day": "Tuesday", "start": "4:00 PM", "end": "10:00 PM", "active": false}, {"day": "Wednesday", "start": "4:00 PM", "end": "10:00 PM", "active": false}, {"day": "Thursday", "start": "4:00 PM", "end": "10:00 PM", "active": true}, {"day": "Friday", "start": "4:00 PM", "end": "10:00 PM", "active": true}, {"day": "Saturday", "start": "4:00 PM", "end": "10:00 PM", "active": true}, {"day": "Sunday", "start": "4:00 PM", "end": "10:00 PM", "active": true}]'::jsonb,
     'night', 13.5, true, '["Busser", "Food Runner", "Host/Hostess"]'::jsonb, 15, now() - interval '14 days'),
    ('10ca0000-0000-4000-8000-000000000017'::uuid, '30b00000-0000-4000-8000-000000000010'::uuid, 'Blue Mountain', '2217 County Hwy 30A', '32459',
     '[{"day": "Monday", "start": "9:00 AM", "end": "5:00 PM", "active": false}, {"day": "Tuesday", "start": "9:00 AM", "end": "5:00 PM", "active": true}, {"day": "Wednesday", "start": "9:00 AM", "end": "5:00 PM", "active": true}, {"day": "Thursday", "start": "9:00 AM", "end": "5:00 PM", "active": true}, {"day": "Friday", "start": "9:00 AM", "end": "5:00 PM", "active": true}, {"day": "Saturday", "start": "9:00 AM", "end": "5:00 PM", "active": true}, {"day": "Sunday", "start": "9:00 AM", "end": "5:00 PM", "active": false}]'::jsonb,
     'flexible', 13.0, false, '["Cashier", "Stock Associate", "Bagger"]'::jsonb, 10, now() - interval '25 days');

-- ---------------------------------------------------------------------------
-- Check before committing. Expect: 10 employers, 17 locations.
select
  (select count(*) from auth.users where email like '%@seed.simplyapply.test') as seed_users,
  (select count(*) from job  where email like '%@seed.simplyapply.test') as seed_companies,
  (select count(*) from locations where employer_id in
     (select id from job where email like '%@seed.simplyapply.test')) as seed_locations,
  (select count(*) from profiles where email like '%@seed.simplyapply.test'
     and subscription_status = 'active') as pro_employers;

commit;
-- rollback;  -- use this instead if the counts look wrong
