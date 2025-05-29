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
    
    const { id } = req.query;

    switch (req.method) {
        case 'GET':
            return await getAdById(req, res, id);
        case 'PATCH':
            return await updateAdById(req, res, id);
        default:
            res.setHeader('Allow', ['GET', 'PATCH']);
            res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}

async function getAdById(req, res, id) {
    const { data, error } = await supabase
        .from('ads')
        .select('*')
        .eq('id', id)
        .single();

    if (error) {
        res.status(error.status || 404).json({ error: error.message });
    } else {
        res.status(200).json({ ad: data });
    }
}

async function updateAdById(req, res, id) {
    const { boost_level } = req.body;

    try {
        const { data: currentAdData, error: getError } = await supabase
            .from('ads')
            .select('boost_level')
            .eq('id', id)
            .single();

        if (getError) throw getError;

        const newBoostLevel = parseFloat(currentAdData.boost_level) + parseFloat(boost_level);

        const { data, error: updateError } = await supabase
            .from('ads')
            .update({ boost_level: newBoostLevel })
            .eq('id', id);

        if (updateError) throw updateError;

        res.status(200).json({ message: 'Ad updated successfully', ad: data });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
}