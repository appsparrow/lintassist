-- Free plan moved from a hardcoded 2 audits to a configurable monthly
-- limit (default 50), and the per-IP new-signup cap raised from 2 to 5.
INSERT OR IGNORE INTO settings (key, value) VALUES ('free_plan_monthly_limit', '50');
UPDATE settings SET value = '5' WHERE key = 'free_signup_ip_daily_cap';
