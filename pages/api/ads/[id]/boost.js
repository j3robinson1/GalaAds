import { supabase } from '../../../../utils/supabaseClient';
import { cors, runMiddleware } from '../../../../utils/corsMiddleware'; 

export default async function handler(req, res) {
    await runMiddleware(req, res, cors);

    const referer = req.headers.referer;

    if (!referer || !referer.startsWith('https://ads.fuzzleprime.com')) {
      return res.status(403).json({ message: 'Unauthorized: This service can only be accessed from the specified iframe.' });
    }
    
    if (req.method === 'POST') {
        const { id } = req.query;
        const { walletAddress, boostAmount } = req.body;

        if (!id || !walletAddress || boostAmount == null) {
            return res.status(400).json({ error: "Missing required parameters." });
        }

        const { error } = await supabase
            .from('ad_activity')
            .insert([
                { 
                    ad_id: id, 
                    wallet_address: walletAddress, 
                    action_type: 'boost', 
                    boost_amount: boostAmount 
                }
            ]);

        if (error) {
            return res.status(500).json({ error: error.message });
        }

        return res.status(200).json({ message: "Boost recorded" });
    } else {
        res.setHeader('Allow', ['POST']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}
