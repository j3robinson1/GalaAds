import Cors from 'cors';

const allowedDomain = 'https://ads.fuzzleprime.com';

const cors = Cors({
  methods: ['GET', 'HEAD', 'POST', 'PATCH'],
  origin: (origin, callback) => {
    if (!origin || origin === allowedDomain) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  }
});

export function runMiddleware(req, res, fn) {
  return new Promise((resolve, reject) => {
    fn(req, res, (result) => {
      if (result instanceof Error) {
        return reject(result);
      }
      return resolve(result);
    });
  });
}

export { cors };