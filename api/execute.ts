import type { VercelRequest, VercelResponse } from '@vercel/node';

// This is a serverless function that acts as your Public REST API
// You can call this from ANYWHERE (Postman, Scripts, etc.)
// POST https://your-domain.vercel.app/api/execute
// Body: { "key": "YOUR_UNIQUE_ID", "code": "PYTHON_CODE" }

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // 1. Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  const { key, code } = req.body;

  if (!key || !code) {
    return res.status(400).json({ error: 'Missing required fields: key and code.' });
  }

  try {
    // We hit the Firebase REST API directly from the serverless function
    // This makes it extremely fast and avoids needing a heavy SDK
    const projectId = "cad-61e27";
    const firebaseContext = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/users/${key}?updateMask.fieldPaths=code&updateMask.fieldPaths=lastRun`;

    const payload = {
      fields: {
        code: { stringValue: code },
        lastRun: { stringValue: new Date().toISOString() }
      }
    };

    const response = await fetch(firebaseContext, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return res.status(response.status).json({ error: 'Firebase update failed', details: errorData });
    }

    return res.status(200).json({ 
      status: 'success', 
      message: 'Code synced successfully. Your Fusion 360 listener should detect it now.',
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    return res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
}
