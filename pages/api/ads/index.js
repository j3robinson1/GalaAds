import { supabase } from '../../../utils/supabaseClient';
import { cors, runMiddleware } from '../../../utils/corsMiddleware';  // Update the path as necessary

export default async function handler(req, res) {
    await runMiddleware(req, res, cors);

    const referer = req.headers.referer;

    if (!referer || !referer.startsWith('https://ads.fuzzleprime.com')) {
      return res.status(403).json({ message: 'Unauthorized: This service can only be accessed from the specified iframe.' });
    }

    if (req.method === 'POST') {
        // Handle ad creation
        return await createAd(req, res);
    } else if (req.method === 'GET') {
        // Handle getting all ads
        return await getAds(req, res);
    } else {
        // Handle any other HTTP method
        res.setHeader('Allow', ['GET', 'POST']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}

// Function to create a new ad
async function createAd(req, res) {
    const { title, content, user_wallet, url, boost_level } = req.body;
    const { data, error } = await supabase
        .from('ads')
        .insert([
            { title, content, user_wallet, url, boost_level }
        ]);

    if (error) return res.status(400).json({ error: error.message });
    res.status(201).json({ message: 'Ad created successfully', ad: data });
}


async function getAds(req, res) {
    const walletAddress = req.query.walletAddress;
    const includeZeroBoost = req.query.includeZeroBoost === 'true'; 
    const profile = req.query.profile === 'true'; 

    let query = supabase
        .from('ads')
        .select('*')
        .order('boost_level', { ascending: false }); 

    if (!includeZeroBoost) {
        query = query.not('boost_level', 'eq', 0); 
    }

    if (walletAddress) {
        if (profile) {
            query = query.eq('user_wallet', walletAddress);
        } else {
            query = query.not('user_wallet', 'eq', walletAddress);
            query = query.eq('published', true);
        }
    }

    const { data, error } = await query;

    if (error) {
        return res.status(400).json({ error: error.message });
    }

    const randomizedData = data.reduce((acc, current) => {
        const index = acc.findIndex(item => item.boost_level === current.boost_level);
        if (index !== -1) {
            const insertionPoint = index + Math.floor(Math.random() * (acc.filter(item => item.boost_level === current.boost_level).length));
            acc.splice(insertionPoint, 0, current);
        } else {
            acc.push(current);
        }
        return acc;
    }, []);

    res.status(200).json({ ads: randomizedData });
}
