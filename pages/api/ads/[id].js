import { supabase } from '../../../utils/supabaseClient';
import { cors, runMiddleware } from '../../../utils/corsMiddleware';  // Update the path as necessary

export default async function handler(req, res) {
    await runMiddleware(req, res, cors);

    const referer = req.headers.referer;

    if (!referer || !referer.startsWith('https://ads.fuzzleprime.com')) {
      return res.status(403).json({ message: 'Unauthorized: This service can only be accessed from the specified iframe.' });
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

// Function to get a specific ad by ID
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

// Function to update an ad by ID
async function updateAdById(req, res, id) {
    const { boost_level } = req.body;

    try {
        // Retrieve the current boost level
        const { data: currentAdData, error: getError } = await supabase
            .from('ads')
            .select('boost_level')
            .eq('id', id)
            .single();

        if (getError) throw getError;

        // Calculate new boost level
        const newBoostLevel = parseFloat(currentAdData.boost_level) + parseFloat(boost_level);

        // Update the ad with the new boost level
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
