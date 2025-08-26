export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const response = await fetch(`https://api.teller.io/accounts/${process.env.TELLER_ACCOUNT_ID}/transactions`, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${Buffer.from(process.env.TELLER_API_KEY + ':').toString('base64')}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Teller API error: ${response.status}`);
    }

    const transactions = await response.json();
    
    // Filtrar solo depósitos (montos positivos)
    const deposits = transactions.filter(transaction => parseFloat(transaction.amount) > 0);
    
    res.status(200).json(deposits);
    
  } catch (error) {
    console.error('Error fetching from Teller:', error);
    res.status(500).json({ error: 'Error conectando con Chase' });
  }
}
