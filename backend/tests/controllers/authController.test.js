const { expect } = require('chai');
const sinon = require('sinon');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../../src/models/User');
const authController = require('../../src/controllers/authController');

function createMockRes() {
  return {
    statusCode: null,
    body: null,
    cookies: {},
    clearedCookies: {},
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.body = data;
      return this;
    },
    cookie(name, val) {
      this.cookies[name] = val;
      return this;
    },
    clearCookie(name) {
      this.clearedCookies[name] = true;
      return this;
    },
  };
}

describe('authController', () => {
  let req;
  let res;

  beforeEach(() => {
    req = { body: {}, cookies: {} };
    res = createMockRes();
    process.env.JWT_SECRET = 'testsecret';
    process.env.JWT_REFRESH_SECRET = 'refreshsecret';
  });

  afterEach(() => {
    sinon.restore();
  });

  it('rejects signup with missing fields', async () => {
    req.body = { email: 'test@test.com' };
    await authController.signup(req, res);

    expect(res.statusCode).to.equal(400);
    expect(res.body.success).to.be.false;
  });

  it('signs up user and sets refresh cookie', async () => {
    req.body = { name: 'Muhammad Hassan', email: 'new@test.com', password: 'password123' };
    sinon.stub(bcrypt, 'hash').resolves('hashed_val');
    sinon.stub(User.prototype, 'save').resolves();
    sinon.stub(jwt, 'sign').returns('mock_token');

    await authController.signup(req, res);

    expect(res.statusCode).to.equal(201);
    expect(res.body.success).to.be.true;
    expect(res.cookies.refreshToken).to.equal('mock_token');
  });

  it('rejects login with missing credentials', async () => {
    req.body = { email: 'test@test.com' };
    await authController.login(req, res);

    expect(res.statusCode).to.equal(400);
  });

  it('rejects login when user is not found', async () => {
    req.body = { email: 'nonexistent@test.com', password: 'password' };
    sinon.stub(User, 'findOne').resolves(null);

    await authController.login(req, res);

    expect(res.statusCode).to.equal(401);
  });

  it('rejects login on invalid password', async () => {
    req.body = { email: 'test@test.com', password: 'wrong' };
    sinon.stub(User, 'findOne').resolves({ password: 'hashedpassword' });
    sinon.stub(bcrypt, 'compare').resolves(false);

    await authController.login(req, res);

    expect(res.statusCode).to.equal(401);
  });

  it('logs in user on valid credentials', async () => {
    req.body = { email: 'test@test.com', password: 'correct' };
    const mockUser = {
      _id: 'user123',
      name: 'Muhammad Hassan',
      email: 'test@test.com',
      password: 'hashedpassword',
      save: sinon.stub().resolves(),
    };
    sinon.stub(User, 'findOne').resolves(mockUser);
    sinon.stub(bcrypt, 'compare').resolves(true);
    sinon.stub(bcrypt, 'hash').resolves('hashed_refresh');
    sinon.stub(jwt, 'sign').returns('mock_token');

    await authController.login(req, res);

    expect(res.statusCode).to.equal(200);
    expect(res.body.success).to.be.true;
    expect(res.cookies.refreshToken).to.equal('mock_token');
  });

  it('logs out user and clears refresh cookie', async () => {
    req.user = { id: 'user123' };
    sinon.stub(User, 'findByIdAndUpdate').resolves({});

    await authController.logout(req, res);

    expect(res.statusCode).to.equal(200);
    expect(res.clearedCookies.refreshToken).to.be.true;
  });
});
