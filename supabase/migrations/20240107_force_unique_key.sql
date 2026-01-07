DO $$ 
BEGIN
    -- 1. Identify and delete duplicates, keeping only the record with the maximum ID
    DELETE FROM bot_settings 
    WHERE id NOT IN (
        SELECT MAX(id) 
        FROM bot_settings 
        GROUP BY key
    );

    -- 2. Try to add the unique constraint if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_constraint 
        WHERE conname = 'bot_settings_key_unique'
    ) THEN
        ALTER TABLE bot_settings ADD CONSTRAINT bot_settings_key_unique UNIQUE (key);
    END IF;
END $$;
