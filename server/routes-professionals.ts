import { Router, Request, Response, NextFunction } from 'express';
import { supabase } from './db';

const router = Router();

router.post('/api/professionals', async (req: Request, res: Response, next: NextFunction) => {
  const { name, email, tel, cpf, profilePicture, active } = req.body;

  if (!name || !email || !tel || !cpf) {
    return res.status(400).json({ error: 'Missing required fields.' });
  }

  const { data, error } = await supabase
    .from('profs')
    .insert([{ name, email, tel, cpf, profilePicture, active }])
    .single();

  if (error) {
    return res.status(400).json({ error: error.message });
  }

  return res.status(201).json(data);
});

export default router;