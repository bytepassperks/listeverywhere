import { FastifyInstance } from 'fastify';
import bcrypt from 'bcryptjs';
import { query, queryOne } from '../db/pool';

interface SignupBody {
  email: string;
  password: string;
}

interface LoginBody {
  email: string;
  password: string;
}

interface UserRow {
  id: string;
  email: string;
  password_hash: string;
  plan: string;
  created_at: string;
}

export async function authRoutes(app: FastifyInstance): Promise<void> {
  app.post<{ Body: SignupBody }>('/api/auth/signup', async (request, reply) => {
    const { email, password } = request.body;

    if (!email || !password) {
      return reply.status(400).send({ error: 'Email and password are required' });
    }

    if (password.length < 8) {
      return reply.status(400).send({ error: 'Password must be at least 8 characters' });
    }

    const existing = await queryOne<UserRow>('SELECT id FROM users WHERE email = $1', [email]);
    if (existing) {
      return reply.status(409).send({ error: 'Email already registered' });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await queryOne<UserRow>(
      `INSERT INTO users (email, password_hash, plan) VALUES ($1, $2, 'free') RETURNING id, email, plan, created_at`,
      [email, passwordHash]
    );

    if (!user) {
      return reply.status(500).send({ error: 'Failed to create user' });
    }

    await query(
      `INSERT INTO subscriptions (user_id, plan, credits) VALUES ($1, 'free', 100)`,
      [user.id]
    );

    const token = app.jwt.sign({ id: user.id, email: user.email }, { expiresIn: '7d' });

    return reply.status(201).send({
      token,
      user: { id: user.id, email: user.email, plan: user.plan },
    });
  });

  app.post<{ Body: LoginBody }>('/api/auth/login', async (request, reply) => {
    const { email, password } = request.body;

    if (!email || !password) {
      return reply.status(400).send({ error: 'Email and password are required' });
    }

    const user = await queryOne<UserRow>(
      'SELECT id, email, password_hash, plan FROM users WHERE email = $1',
      [email]
    );

    if (!user) {
      return reply.status(401).send({ error: 'Invalid credentials' });
    }

    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return reply.status(401).send({ error: 'Invalid credentials' });
    }

    const token = app.jwt.sign({ id: user.id, email: user.email }, { expiresIn: '7d' });

    return reply.send({
      token,
      user: { id: user.id, email: user.email, plan: user.plan },
    });
  });

  app.post('/api/auth/logout', async (_request, reply) => {
    return reply.send({ message: 'Logged out successfully' });
  });

  app.get('/api/auth/me', {
    preValidation: [app.authenticate],
  }, async (request, reply) => {
    const user = await queryOne<UserRow>(
      'SELECT id, email, plan, created_at FROM users WHERE id = $1',
      [request.userId]
    );

    if (!user) {
      return reply.status(404).send({ error: 'User not found' });
    }

    return reply.send({ user: { id: user.id, email: user.email, plan: user.plan, created_at: user.created_at } });
  });
}
