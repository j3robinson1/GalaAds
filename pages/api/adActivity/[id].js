import { supabase } from '../../../utils/supabaseClient';
import { cors, runMiddleware } from '../../../utils/corsMiddleware'; 

export default async function handler(req, res) {
    await runMiddleware(req, res, cors);

    const referer = req.headers.referer;

    if (!referer || !referer.startsWith('https://ads.fuzzleprime.com')) {
      return res.status(403).json({ message: 'Unauthorized: This service can only be accessed from the specified iframe.' });
    }
    
    const { id } = req.query;
    const { walletAddress } = req.query; 

    if (!id) {
        return res.status(400).json({ error: "Ad ID is required" });
    }

    let query = supabase
        .from('ad_activity')
        .select('action_type, created_at')
        .eq('ad_id', id)
        .not('claimed', 'eq', 'TRUE');

    if (walletAddress) {
        query = query.eq('wallet_address', walletAddress);
    }

    try {
        const { data, error } = await query;

        if (error) {
            throw error;
        }

        const groupedData = data.reduce((acc, curr) => {
            const date = curr.created_at.split('T')[0]; 
            if (!acc[date]) {
                acc[date] = { views: 0, clicks: 0, boosts: 0 };
            }
            if (curr.action_type === 'view') {
                acc[date].views += 1;
            } else if (curr.action_type === 'click') {
                acc[date].clicks += 1;
            } else if (curr.action_type === 'boost') {
                acc[date].boosts += (curr.boost_amount || 0);
            }
            return acc;
        }, {});

        const result = Object.keys(groupedData).sort().map(date => ({
            date,
            ...groupedData[date]
        }));

        res.status(200).json({ data: result });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}
