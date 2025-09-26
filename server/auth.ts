// server/auth.ts
// 요청 헤더의 토큰을 검증해 userId를 req에 싣는 최소 미들웨어
import type { Request, Response, NextFunction } from 'express';
// Replit Auth 검증 API에 맞춰 토큰 검증 로직을 작성 (예: JWT verify endpoint/SDK)
export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'unauthorized' });
  try {
    // TODO: Replit Auth 토큰 검증. 성공 시 req.user = { id: '...' }
    // ex) const user = await verifyReplitToken(token);
    (req as any).user = { id: 'demo' };
    next();
  } catch {
    res.status(401).json({ error: 'invalid token' });
  }
}
