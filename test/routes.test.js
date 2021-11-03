const app = require('../server.js');
const supertest = require('supertest');
const request = supertest(app);
const db = require('../service');

let token, userId;

describe('Authentication routes', () => {
  it('Should register a user', async () => {
    //Get Joe Mama out of the db if exists
    await db.deactivateUserByEmail('joemama@email.com');

    const response = await request.post('/register').send({
      first_name: 'Joe',
      last_name: 'Mama',
      username: 'joema',
      email: 'joemama@email.com',
      password: 'passw0rd',
    });

    token = response.body.token;
    userId = response.body.userId;

    expect(response.status).toBe(201);
    expect(typeof response.body === 'object').toBe(true);
    expect(response.body.token).toBeDefined();
  });

  it('Should not register a user without proper credentials', async () => {
    const response = await request.post('/register').send({
      first_name: 'Jeff',
      last_name: 'Papa',
      username: 'jeffpap',
      email: 'jeffpapa@email.com',
      //No password
    });

    expect(response.status).toBe(400);
  });

  it('Should login an existing user', async () => {
    const response = await request.post('/login').send({
      email: 'joemama@email.com',
      password: 'passw0rd',
    });

    expect(response.status).toBe(200);
    expect(typeof response.body === 'object').toBe(true);
    expect(response.body.token).toBeDefined();
  });

  it('Should not login a non-existent user', async () => {
    const response = await request.post('/login').send({
      email: 'jeffpapa@email.com',
      password: 'passWORD',
    });

    expect(response.status).toBe(400);
  });

  it('Should change password of existing user', async () => {
    const response = await request
      .post('/changePassword')
      .send({
        userId,
        oldPassword: 'passw0rd',
        newPassword: 'moreSecurePassword!!',
      })
      .set('x-access-token', token);

    const response2 = await request.post('/login').send({
      email: 'joemama@email.com',
      password: 'moreSecurePassword!!',
    });

    expect(response.status).toBe(200);
    expect(response2.status).toBe(200);
    expect(typeof response2.body === 'object').toBe(true);
    expect(response2.body.token).toBeDefined();
  });

  it('Should authorize a logged in user with a token', async () => {
    const response = await request.get('/auth').send({ userId }).set('x-access-token', token);

    expect(response.status).toBe(200);
  });

  it('Should reject a user without a token', async () => {
    const response = await request.get('/auth');

    expect(response.status).toBe(403);
  });

  it('Should deactivate a user', async () => {
    const response = await request
      .post('/deactivate')
      .send({
        userId,
      })
      .set('x-access-token', token);

    expect(response.status).toBe(200);
  });
});
