import { pool, query } from '../src/db/pool';
import directories from './directories.json';

async function seed() {
  console.log(`Seeding ${directories.length} directories...`);

  for (const dir of directories) {
    await query(
      `INSERT INTO directories (
         name, submit_url, submission_type, title_limit, desc_limit,
         requires_logo, requires_screenshot, requires_category,
         category_taxonomy, notes, active
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, true)
       ON CONFLICT DO NOTHING`,
      [
        dir.name,
        dir.submit_url,
        dir.submission_type,
        dir.title_limit,
        dir.desc_limit,
        dir.requires_logo,
        dir.requires_screenshot,
        dir.requires_category,
        JSON.stringify(dir.category_taxonomy),
        dir.notes,
      ]
    );
    console.log(`  Seeded: ${dir.name} (${dir.submission_type})`);
  }

  console.log(`Done. ${directories.length} directories seeded.`);
  await pool.end();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
