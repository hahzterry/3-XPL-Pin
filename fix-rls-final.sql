DROP POLICY IF EXISTS "public can read editions_artwork" ON editions_artwork;
DROP POLICY IF EXISTS "anon can insert editions_artwork" ON editions_artwork;
DROP POLICY IF EXISTS "authenticated can insert editions_artwork" ON editions_artwork;
DROP POLICY IF EXISTS "authenticated can update editions_artwork" ON editions_artwork;
CREATE POLICY "Allow public read access" ON editions_artwork FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow public insert access" ON editions_artwork FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Allow public update access" ON editions_artwork FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
