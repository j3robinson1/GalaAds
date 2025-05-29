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

    if (req.method === 'POST') {
        return await createAd(req, res);
    } else if (req.method === 'GET') {
        return await getAds(req, res);
    } else {
        res.setHeader('Allow', ['GET', 'POST']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}

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

    if (!profile || !walletAddress) {
        query = query.eq('published', true);
    }

    if (walletAddress) {
        if (profile) {
            query = query.eq('user_wallet', walletAddress);
        } else {
            query = query.not('user_wallet', 'eq', walletAddress);
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