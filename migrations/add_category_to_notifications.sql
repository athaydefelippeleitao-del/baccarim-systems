-- Migration: add category column to notifications table
-- Run this in Supabase > SQL Editor

ALTER TABLE notifications
  ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'Notificação';

-- Update existing rows that had no category (all treated as 'Notificação')
UPDATE notifications SET category = 'Notificação' WHERE category IS NULL OR category = '';
