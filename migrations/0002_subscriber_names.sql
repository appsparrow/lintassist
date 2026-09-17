-- Adds first/last name so the free-access signup flow (POST /access)
-- can capture who signed up, for the admin table and eventual outreach.
ALTER TABLE subscribers ADD COLUMN first_name TEXT;
ALTER TABLE subscribers ADD COLUMN last_name TEXT;
