import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { supabase } from '../db/supabase.js';

function createToken(company) {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not configured.');
  }

  return jwt.sign(
    {
      companyId: company.id,
      email: company.email,
      slug: company.slug,
      companyName: company.company_name,
    },
    secret,
    { expiresIn: '7d' }
  );
}

export async function register(req, res) {
  try {
    const { companyName, slug, email, password } = req.body;

    if (!companyName || !slug || !email || !password) {
      return res.status(400).json({ message: 'companyName, slug, email, and password are required.' });
    }

    if (!supabase) {
      return res.status(500).json({ message: 'Supabase is not configured.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const { data, error } = await supabase
      .from('companies')
      .insert([{ company_name: companyName, slug, email, password_hash: passwordHash }])
      .select('id, company_name, slug, email, created_at')
      .single();

    if (error) {
      throw error;
    }

    const token = createToken(data);

    return res.status(201).json({ company: data, token });
  } catch (err) {
    console.error('register error', err);
    if (err?.code === 'PGRST205') {
      return res.status(500).json({
        message: 'Supabase schema is missing the companies table. Apply the SQL migration in docs/supabase-setup.md or backend/migrations/001_initial_schema.sql, then try again.',
        error: err.message,
      });
    }
    return res.status(500).json({ message: 'Failed to register company' });
  }
}

export async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'email and password are required.' });
    }

    if (!supabase) {
      return res.status(500).json({ message: 'Supabase is not configured.' });
    }

    const { data, error } = await supabase
      .from('companies')
      .select('id, company_name, slug, email, password_hash, created_at')
      .eq('email', email)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!data) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    const passwordMatches = await bcrypt.compare(password, data.password_hash);
    if (!passwordMatches) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    const token = createToken(data);
    const { password_hash, ...company } = data;

    return res.json({ company, token });
  } catch (err) {
    console.error('login error', err);
    if (err?.code === 'PGRST205') {
      return res.status(500).json({
        message: 'Supabase schema is missing the companies table. Apply the SQL migration in docs/supabase-setup.md or backend/migrations/001_initial_schema.sql, then try again.',
        error: err.message,
      });
    }
    return res.status(500).json({ message: 'Failed to log in' });
  }
}

export async function me(req, res) {
  try {
    const { data, error } = await supabase
      .from('companies')
      .select('id, company_name, slug, email, created_at')
      .eq('id', req.auth.companyId)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!data) {
      return res.status(404).json({ message: 'Company not found.' });
    }

    return res.json({ company: data });
  } catch (err) {
    console.error('me error', err);
    if (err?.code === 'PGRST205') {
      return res.status(500).json({
        message: 'Supabase schema is missing the companies table. Apply the SQL migration in docs/supabase-setup.md or backend/migrations/001_initial_schema.sql, then try again.',
        error: err.message,
      });
    }
    return res.status(500).json({ message: 'Failed to fetch company profile.' });
  }
}
