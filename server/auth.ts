// server/auth.tsx
import express, { Request, Response, NextFunction } from 'express';
import session from 'express-session';
import jwt from 'jsonwebtoken';
import { supabase } from './db'; // Certifique-se de que o supabase client está configurado corretamente

const router = express.Router();

const sessionSettings: session.SessionOptions = {
  secret: process.env.SESSION_SECRET || "default-secret",
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 1000 * 60 * 60 * 24 * 365 * 10, // 10 anos em milissegundos
    httpOnly: true, // O cookie não pode ser acessado via JavaScript no cliente
    secure: process.env.NODE_ENV === "production", // Apenas HTTPS em produção
  },
};

router.use(session(sessionSettings));

/**
 * Endpoint de Login:
 * - Recebe email e password
 * - Autentica via Supabase Auth (signInWithPassword)
 * - Valida o JWT (session.access_token) usando a chave SUPABASE_JWT_SECRET
 * - Cria a sessão do Express com os dados do usuário
 */
router.post('/api/login', async (req: Request, res: Response, next: NextFunction) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Missing credentials: email and password are required.' });
  }

  // Autentica com Supabase Auth
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.user || !data.session) {
    console.error('Error logging in:', error);
    return res.status(401).json({ error: 'Supabase recusou a solicitação de login. Invalid Credentials' });
  }
  const { user, session } = data;

  // Validação opcional do JWT (session.access_token)
  if (session.access_token) {
    try {
      // A chave SUPABASE_JWT_SECRET deve estar definida nas variáveis de ambiente
      // console.log("SUPABASE_JWT_SECRET:", process.env.SUPABASE_JWT_SECRET);

      const decoded = jwt.verify(session.access_token, process.env.SUPABASE_JWT_SECRET!);
      console.log("JWT validated:", decoded);
    } catch (err) {
      console.error("Invalid JWT", err);
      return res.status(401).json({ error: 'Invalid token.' });
    }
  }

  // Cria a sessão Express com os dados do usuário autenticado
  req.session.user = {
    id: user.id,
    email: user.email || '',
    name: user.user_metadata.name,
    role: user.user_metadata.role,
  };

  return res.json({ user: req.session.user });
});

/**
 * Endpoint de Registro:
 * - Recebe email, password e demais dados (name, phone, role)
 * - Registra o usuário via Supabase Auth (signUp)
 * - Opcional: a criação do perfil na tabela pública pode ser feita via trigger no banco
 * - Cria a sessão Express para acesso imediato (caso não haja verificação de email)
 */
router.post('/api/register', async (req: Request, res: Response, next: NextFunction) => {
  const { email, password, name, phone, role } = req.body;
  if (!email || !password || !name) {
    return res.status(400).json({ error: 'Missing required fields.' });
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name, phone, role: role || 'client' },
    },
  });
  if (error || !data.user) {
    return res.status(400).json({ error: error?.message || 'Error registering user.' });
  }

  // Opcional: se não utilizar trigger para criar perfil, insira aqui o código para criar
  // o registro na tabela public.users.

  // Cria a sessão Express para acesso imediato
  req.session.user = {
    id: data.user.id,
    email: data.user.email || '',
    name: data.user.user_metadata.name,
    role: data.user.user_metadata.role,
  };

  return res.json({ user: req.session.user });
});

/**
 * Endpoint de Logout:
 * - Efetua signOut no Supabase Auth
 * - Destrói a sessão do Express
 */
router.post('/api/logout', async (req: Request, res: Response, next: NextFunction) => {
  await supabase.auth.signOut();
  req.session.destroy(err => {
    if (err) {
      return res.status(500).json({ error: 'Error terminating session.' });
    }
    return res.status(204).end();
  });
});

export default router;
