-- Create waitlist table if not exists
CREATE TABLE IF NOT EXISTS waitlist (id INTEGER PRIMARY KEY AUTOINCREMENT, email TEXT UNIQUE NOT NULL, created_at DATETIME DEFAULT CURRENT_TIMESTAMP);

-- Add new columns if not exists
-- Only add columns if they do not already exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pragma_table_info('waitlist') WHERE name = 'ip') THEN
        ALTER TABLE waitlist ADD COLUMN ip TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pragma_table_info('waitlist') WHERE name = 'user_agent') THEN
        ALTER TABLE waitlist ADD COLUMN user_agent TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pragma_table_info('waitlist') WHERE name = 'country') THEN
        ALTER TABLE waitlist ADD COLUMN country TEXT;
    END IF;
END;
$$;
