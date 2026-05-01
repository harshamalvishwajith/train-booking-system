const errorHandler = require('../src/middleware/errorHandler');

describe('errorHandler middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {};
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
    // Suppress console.error in tests
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should handle Mongoose duplicate key error (11000)', () => {
    const err = { code: 11000, keyValue: { email: 'test@example.com' }, message: 'Duplicate key error' };
    errorHandler(err, req, res, next);
    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'email already exists' });
  });

  it('should handle Mongoose CastError', () => {
    const err = { name: 'CastError', message: 'Cast to ObjectId failed' };
    errorHandler(err, req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Invalid ID format' });
  });

  it('should handle Mongoose ValidationError', () => {
    const err = { 
      name: 'ValidationError', 
      errors: {
        field1: { message: 'Field 1 is required' },
        field2: { message: 'Field 2 is invalid' }
      },
      message: 'Validation failed'
    };
    errorHandler(err, req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Field 1 is required, Field 2 is invalid' });
  });

  it('should use error status if provided', () => {
    const err = { status: 403, message: 'Forbidden' };
    errorHandler(err, req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    // process.env.NODE_ENV is likely 'test', so it might return 'Forbidden' or 'Internal server error' depending on env. 
    // Usually jest runs in NODE_ENV=test so it uses err.message.
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Forbidden' });
  });

  it('should default to 500 status', () => {
    const err = { message: 'Something went wrong' };
    errorHandler(err, req, res, next);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Something went wrong' });
  });
});
