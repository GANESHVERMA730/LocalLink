export function errorHandler(err, req, res, _next) {
  console.error('Unhandled error:', err);
  if (err.name === 'ZodError') {
    return res.status(400).json({ error: 'Validation failed', details: err.errors });
  }
  if (err.name === 'MongoServerError' && err.code === 11000) {
    return res.status(409).json({ error: 'A record with that value already exists' });
  }
  const status = err.status || 500;
  const message = err.message || 'Something went wrong';
  res.status(status).json({ error: message });
}
