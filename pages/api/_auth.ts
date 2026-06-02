import { NextApiRequest, NextApiResponse } from 'next'

export function requireApiKey(req: NextApiRequest, res: NextApiResponse): boolean {
  const secret = process.env.DEPLOY_API_SECRET
  if (!secret) {
    res.status(500).json({ error: 'DEPLOY_API_SECRET not configured' })
    return false
  }
  const provided = req.headers['x-api-key']
  if (provided !== secret) {
    res.status(401).json({ error: 'Unauthorized' })
    return false
  }
  return true
}
