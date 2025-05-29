import { supabase } from '../../../utils/supabaseClient';
import { cors, runMiddleware } from '../../../utils/corsMiddleware';

export default async function handler(req, res) {
    await runMiddleware(req, res, cors);

    const referer = req.headers.referer;
    const isDevelopment = process.env.NODE_ENV === 'development';

    if (!referer || (!isDevelopment && !referer.startsWith('https://ads.fuzzleprime.com')) || 
        (isDevelopment && !referer.startsWith('http://localhost:3000') && !referer.startsWith('https://localhost:3000'))) {
      return res.status(403).json({ message: 'Unauthorized: Invalid referer.' });
    }
    
    const { walletAddress } = req.query;

    if (!walletAddress) {
        return res.status(400).json({ error: "Wallet address is required" });
    }

    const { data, error } = await supabase
        .from('ad_activity')
        .select('*')
        .match({ wallet_address: walletAddress })
        .not('action_type', 'eq', 'boost')
        .not('claimed', 'eq', 'TRUE');

    if (error) {
        return res.status(500).json({ error: error.message });
    }

    const earnings = data.reduce((acc, curr) => {
        if (curr.action_type === 'view') {
            acc[curr.ad_id] = (acc[curr.ad_id] || 0) + 0.005;
        } else if (curr.action_type === 'click') {
            acc[curr.ad_id] = (acc[curr.ad_id] || 0) + 0.02;
        }
        return acc;
    }, {});

    res.status(200).json({ earnings });
}