DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_configs' AND column_name = 'telegram_enabled') THEN 
        ALTER TABLE "user_configs" ADD COLUMN "telegram_enabled" BOOLEAN DEFAULT true; 
    END IF;
END $$;
