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


// Function to get all ads, optionally excluding ads with the specified wallet address and/or with boost_level of 0
async function getAds(req, res) {
    const walletAddress = req.query.walletAddress;
    const includeZeroBoost = req.query.includeZeroBoost === 'true'; // Check if includeZeroBoost parameter is true
    const profile = req.query.profile === 'true'; // Check if ads from the profile should be included

    let query = supabase
        .from('ads')
        .select('*')
        .order('boost_level', { ascending: false }); // Order by boost_level in descending order

    if (!includeZeroBoost) {
        query = query.not('boost_level', 'eq', 0); // Exclude ads where boost_level is 0 unless includeZeroBoost is true
    }

    if (walletAddress) {
        if (profile) {
            // If profile is true, include ads that match the walletAddress
            query = query.eq('user_wallet', walletAddress);
        } else {
            // Default behavior: exclude ads with the matching wallet address
            query = query.not('user_wallet', 'eq', walletAddress);
        }
    }

    const { data, error } = await query;

    if (error) {
        return res.status(400).json({ error: error.message });
    }

    // Randomize ads with the same boost_level
    const randomizedData = data.reduce((acc, current) => {
        const index = acc.findIndex(item => item.boost_level === current.boost_level);
        if (index !== -1) {
            // Insert current item at a random position within its boost_level group
            const insertionPoint = index + Math.floor(Math.random() * (acc.filter(item => item.boost_level === current.boost_level).length));
            acc.splice(insertionPoint, 0, current);
        } else {
            acc.push(current);
        }
        return acc;
    }, []);

    res.status(200).json({ ads: randomizedData });
}
