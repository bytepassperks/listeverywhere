import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { query, queryOne } from './pool';

export async function seedSuperAdmin(): Promise<void> {
  const email = 'harryroger798@gmail.com';
  const existing = await queryOne<{ id: string }>('SELECT id FROM users WHERE email = $1', [email]);

  if (existing) {
    await query('UPDATE users SET role = $1 WHERE email = $2', ['super_admin', email]);
    console.log(`Super admin already exists (${email}), ensured role is super_admin.`);
    return;
  }

  const passwordHash = await bcrypt.hash('007JamesBond@@', 12);
  const user = await queryOne<{ id: string }>(
    `INSERT INTO users (email, password_hash, plan, role) VALUES ($1, $2, 'pro', 'super_admin') RETURNING id`,
    [email, passwordHash]
  );

  if (user) {
    await query(
      `INSERT INTO subscriptions (user_id, plan, credits) VALUES ($1, 'pro', 999999)`,
      [user.id]
    );
    console.log(`Super admin created: ${email}`);
  }
}

interface DirectorySeed {
  name: string;
  submit_url: string;
  submission_type: string;
  title_limit: number;
  desc_limit: number;
  requires_logo: boolean;
  requires_screenshot: boolean;
  requires_category: boolean;
  category_taxonomy: string[];
  notes: string;
}

export async function seedDirectories(): Promise<void> {
  const existing = await queryOne<{ count: string }>('SELECT COUNT(*) as count FROM directories');
  const count = parseInt(existing?.count || '0', 10);

  if (count > 0) {
    console.log(`Directories already seeded (${count} found). Skipping.`);
    return;
  }

  const seedPath = path.resolve(__dirname, '../../seed/directories.json');
  if (!fs.existsSync(seedPath)) {
    console.warn('Seed file not found at', seedPath, '- skipping directory seed');
    return;
  }

  const directories: DirectorySeed[] = JSON.parse(fs.readFileSync(seedPath, 'utf-8'));
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
  }

  console.log(`Done. ${directories.length} directories seeded.`);
}
