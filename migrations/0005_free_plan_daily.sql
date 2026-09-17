-- Free plan reverted from a flat 50/month back to 5/day: daily reset
-- brings people back more often and surfaces real usage patterns while
-- paid subscriptions aren't live yet, and the signup form is the
-- interim email-collection mechanism.
DELETE FROM settings WHERE key = 'free_plan_monthly_limit';
INSERT OR IGNORE INTO settings (key, value) VALUES ('free_plan_daily_limit', '5');
