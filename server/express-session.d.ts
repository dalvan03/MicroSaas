// express-session.d.ts
// Extensão de Tipos (Opcional):
// Para evitar o uso de (req.session as any).user em todo o código, é recomendável criar um arquivo de declaração, por exemplo, express-session.d.ts na raiz do servidor:

import "express-session";

declare module "express-session" {
  interface SessionData {
    user?: {
      id: string;
      email: string;
      name?: string;
      role: string;
    }
  }
}
