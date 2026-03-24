import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  console.log('🧪 Test API route called');
  console.log('Method:', req.method);
  console.log('Headers:', req.headers);

  res.status(200).json({
    success: true,
    message: 'Test API route is working',
    method: req.method,
    timestamp: new Date().toISOString()
  });
}
