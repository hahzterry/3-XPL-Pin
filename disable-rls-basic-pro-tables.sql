-- Disable RLS for basic_artwork and pro_artwork tables
-- This matches the setup used for editions_artwork table

ALTER TABLE basic_artwork DISABLE ROW LEVEL SECURITY;
ALTER TABLE pro_artwork DISABLE ROW LEVEL SECURITY;
