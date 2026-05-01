const validate = require('../src/middleware/validate');
const { validationResult } = require('express-validator');

jest.mock('express-validator', () => ({
  validationResult: jest.fn(),
}));

describe('validate middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {};
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  it('should call next if there are no errors', () => {
    validationResult.mockReturnValue({
      isEmpty: () => true,
    });

    validate(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
  });

  it('should return 400 with errors if validation fails', () => {
    const mockErrors = [{ msg: 'Invalid email' }, { msg: 'Password too short' }];
    validationResult.mockReturnValue({
      isEmpty: () => false,
      array: () => mockErrors,
    });

    validate(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ success: false, errors: mockErrors });
  });
});
