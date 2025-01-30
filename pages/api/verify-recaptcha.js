import { cors, runMiddleware } from '../../utils/corsMiddleware';  // Update the path as necessary

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    await runMiddleware(req, res, cors);

    const referer = req.headers.referer;

    if (!referer || !referer.startsWith('https://ads.fuzzleprime.com')) {
      return res.status(403).json({ message: 'Unauthorized: This service can only be accessed from the specified iframe.' });
    }

    const { recaptchaToken } = req.body;

    if (!recaptchaToken) {
        return res.status(400).json({ error: 'Missing ReCAPTCHA token' });
    }

    try {
        const secretKey = process.env.RECAPTCHA_SECRET_KEY; 
        const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: `secret=${secretKey}&response=${recaptchaToken}`,
        });

        const data = await response.json();

        if (!data.success) {
            return res.status(400).json({ error: 'Failed ReCAPTCHA verification', details: data });
        }

        // ReCAPTCHA passed
        return res.status(200).json({ success: true });
    } catch (error) {
        console.error('Error verifying ReCAPTCHA:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
