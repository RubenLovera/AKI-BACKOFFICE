import https from 'https';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Crear certificados desde las variables de entorno
    const cert = process.env.TELLER_CERT;
    const key = process.env.TELLER_PRIVATE_KEY;
    const token = process.env.TELLER_API_KEY;
    const accountId = process.env.TELLER_ACCOUNT_ID;

    if (!cert || !key || !token || !accountId) {
      throw new Error('Missing environment variables');
    }

    // Hacer petición con certificados SSL para payments (Zelle)
    const options = {
      hostname: 'api.teller.io',
      port: 443,
      path: `/accounts/${accountId}/payments`,
      method: 'GET',
      cert: cert,
      key: key,
      headers: {
        'Authorization': `Basic ${Buffer.from(token + ':').toString('base64')}`,
        'Content-Type': 'application/json'
      }
    };

    const data = await new Promise((resolve, reject) => {
      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          if (res.statusCode === 200) {
            resolve(JSON.parse(data));
          } else {
            reject(new Error(`Teller API error: ${res.statusCode} - ${data}`));
          }
        });
      });
      req.on('error', reject);
      req.end();
    });

    // Filtrar solo pagos Zelle recibidos (depósitos)
    const deposits = data.filter(payment => {
      return parseFloat(payment.amount) > 0 && 
             payment.payee && 
             payment.payee.scheme === 'zelle';
    });
    
    res.status(200).json(deposits);
    
  } catch (error) {
    console.error('Error fetching from Teller:', error.message);
    res.status(500).json({ error: 'Error conectando con Chase', details: error.message });
  }
}
