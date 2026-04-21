import { pool, query, queryOne } from '../src/db/pool';
import directories from './directories_10k.json';

export async function seedDirectories10k() {
  const existing = await queryOne<{ count: string }>('SELECT COUNT(*) as count FROM directories');
  const count = parseInt(existing?.count || '0', 10);
  console.log(`Current directory count: ${count}`);
  console.log(`New directories to process: ${directories.length}`);

  // Add unique constraint on name if it doesn't exist
  await query(`
    DO $$ BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'directories_name_unique'
      ) THEN
        ALTER TABLE directories ADD CONSTRAINT directories_name_unique UNIQUE (name);
      END IF;
    END $$;
  `);

  let inserted = 0;
  let skipped = 0;
  const batchSize = 100;

  for (let i = 0; i < directories.length; i += batchSize) {
    const batch = directories.slice(i, i + batchSize);
    
    for (const dir of batch) {
      try {
        const result = await query(
          `INSERT INTO directories (
             name, submit_url, submission_type, title_limit, desc_limit,
             requires_logo, requires_screenshot, requires_category,
             category_taxonomy, notes, active
           ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, true)
           ON CONFLICT (name) DO NOTHING`,
          [
            dir.name,
            dir.submit_url,
            dir.submission_type,
            dir.title_limit || 100,
            dir.desc_limit || 500,
            dir.requires_logo || false,
            dir.requires_screenshot || false,
            dir.requires_category || false,
            JSON.stringify(dir.category_taxonomy || []),
            dir.notes || '',
          ]
        );
        if (result.rowCount && result.rowCount > 0) {
          inserted++;
        } else {
          skipped++;
        }
      } catch (err: any) {
        skipped++;
      }
    }

    if ((i + batchSize) % 1000 === 0 || i + batchSize >= directories.length) {
      console.log(`Progress: ${Math.min(i + batchSize, directories.length)}/${directories.length} processed (${inserted} inserted, ${skipped} skipped)`);
    }
  }

  const final = await queryOne<{ count: string }>('SELECT COUNT(*) as count FROM directories');
  console.log(`\nDone. ${inserted} new directories inserted, ${skipped} duplicates skipped.`);
  console.log(`Total directories in database: ${final?.count}`);
}

if (require.main === module) {
  seedDirectories10k()
    .then(() => pool.end())
    .catch((err) => {
      console.error('Seed failed:', err);
      process.exit(1);
    });
}
