const { expect } = require('chai');
const sinon = require('sinon');
const jwt = require('jsonwebtoken');
const authMiddleware = require('../../src/middleware/authMiddleware');

function createMockRes() {
  return {
    statusCode: null,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.body = data;
      return this;
    },
  };
}

describe('authMiddleware', () => {
  let req;
  let res;
  let next;
  let originalJwtSecret;

  beforeEach(() => {
    originalJwtSecret = process.env.JWT_SECRET;
    req = { headers: {} };
    res = createMockRes();
    next = sinon.spy();
    process.env.JWT_SECRET = 'testsecret';
  });

  afterEach(() => {
    sinon.restore();
    if (originalJwtSecret !== undefined) {
      process.env.JWT_SECRET = originalJwtSecret;
    } else {
      delete process.env.JWT_SECRET;
    }
  });

  it('returns 401 when Authorization header is missing', () => {
    authMiddleware(req, res, next);

    expect(res.statusCode).to.equal(401);
    expect(next.called).to.be.false;
  });

  it('returns 401 on invalid token', () => {
    req.headers.authorization = 'Bearer invalid';
    sinon.stub(jwt, 'verify').throws(new Error('jwt expired'));

    authMiddleware(req, res, next);

    expect(res.statusCode).to.equal(401);
    expect(next.called).to.be.false;
  });

  it('sets req.user and calls next() on valid token', () => {
    req.headers.authorization = 'Bearer valid';
    sinon.stub(jwt, 'verify').returns({ id: 'user123' });

    authMiddleware(req, res, next);

    expect(req.user).to.deep.equal({ id: 'user123' });
    expect(next.calledOnce).to.be.true;
  });
});
