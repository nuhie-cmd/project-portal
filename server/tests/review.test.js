// review.test.js – sanity test for the proposal‑review endpoint
const request = require('supertest');
const app = require('../index'); // Express app

// Mock authentication middleware (same as in users.test)
jest.mock('../middleware/auth', () => {
  const original = jest.requireActual('../middleware/auth');
  return {
    ...original,
    requireAuth: (req, res, next) => { req.user = { id: 1, role: 'guide' }; next(); },
    requireRole: role => (req, res, next) => { req.user.role = role; next(); },
  };
});

describe('Review route', () => {
  test('POST /api/review/proposal returns a review string', async () => {
    const payload = { proposal: 'This is a sample proposal text that the AI will review.' };
    const res = await request(app)
      .post('/api/review/proposal')
      .send(payload);
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('review');
    expect(typeof res.body.review).toBe('string');
    // Basic sanity – should contain the original proposal excerpt
    expect(res.body.review).toContain('This is a sample proposal');
  });
});
