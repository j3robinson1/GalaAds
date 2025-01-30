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
        const { walletAddress } = req.body; // Assume walletAddress is sent in the body

        // Insert a record into ad_activity
        const { error } = await supabase
            .from('ad_activity')
            .insert([
                { ad_id: id, wallet_address: walletAddress, action_type: 'view' }
            ]);

        if (error) {
            return res.status(500).json({ error: error.message });
        }

        return res.status(200).json({ message: "View recorded" });
    } else {
        res.setHeader('Allow', ['POST']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}
