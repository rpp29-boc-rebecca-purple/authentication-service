const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../service');
const { userFrom } = require('./helpers');
const axios = require('axios');

module.exports = {
  register: (req, res) => {
    const { first_name, last_name, username, email, password } = req.body;

    if (!(email && password)) {
      res.status(400).send('Both email and password are required.');
    }

    db.userExists(email)
      .then(async result => {
        let exists = result.rows[0].up_user_exists;

        if (exists) {
          res.status(409).send('User already exists');
        } else {
          const password_hash = await bcrypt.hash(password, 10);
          const userResult = await db.createUser({ ...req.body, oauth: false }, password_hash);
          const user = userResult.rows[0].up_user_create;

          user.id = user.f1;
          user.first_name = user.f2;
          user.last_name = user.f3;
          user.email = user.f4;

          user.token = jwt.sign({ user_id: user.id, email }, process.env.TOKEN_KEY, {
            expiresIn: '3h',
          });

          res.status(201).json(userFrom(user));
        }
      })
      .catch(err => {
        res.status(400).send(err);
      });
  },

  login: async (req, res) => {
    const { email, password } = req.body;

    if (!(email && password)) {
      res.status(400).send('Both email and password are required.');
    }

    const userResult = await db.getUser(email);
    const user = userResult.rows?.[0]?.up_user_get?.[0];

    if (user && (await bcrypt.compare(password, user.password_hash))) {
      user.token = jwt.sign({ user_id: user.id, email }, process.env.TOKEN_KEY, {
        expiresIn: '3h',
      });

      res.status(201).json(userFrom(user));
    }

    res.status(400).send('Invalid Credentials');
  },

  isAuthenticated: (req, res) => {
    res.status(200).send('OK');
  },

  changePassword: async (req, res) => {
    const { email, oldPassword, newPassword } = req.body;

    if (!email || !oldPassword || !newPassword) {
      res.status(401).send('Provide an email, new password, and old password');
    }

    const userResult = await db.getUser(email);
    const user = userResult.rows?.[0]?.up_user_get?.[0];
    const oldPasswordHash = user.password_hash;

    if (user.oauth) {
      res.status(401).send('Cannot change password for an OAuth user');
    }

    if (oldPassword && (await bcrypt.compare(oldPassword, oldPasswordHash))) {
      let newHash = await bcrypt.hash(newPassword, 10);

      const editResult = await db.editUser(email, { password_hash: newHash });

      if (editResult.rowCount === 1) {
        res.status(200).send('OK');
      } else {
        res.status(401).send(editResult._types.text);
      }
    } else {
      res.status(401).send('Old password does not match');
    }
  },

  oauth: async (req, res) => {
    let { accessToken } = req.body;
    let profileResponse;

    try {
      profileResponse = await axios.get(`https://www.googleapis.com/oauth2/v3/userinfo?access_token=${accessToken}`);
    } catch (err) {
      res.status(401).json('Invalid access token');
    }

    const { email, given_name: first_name, family_name: last_name } = profileResponse.data;
    const userResult = await db.getUser(email);
    const user = userResult.rows?.[0]?.up_user_get?.[0];

    // New OAuth sign in
    if (!user) {
      const userCreateResult = await db.createUser(
        {
          email,
          first_name,
          last_name,
          username: email.substring(0, email.indexOf('@')),
          oauth: true,
        },
        ''
      );

      const newUser = userCreateResult.rows[0].up_user_create;

      newUser.id = newUser.f1;
      newUser.first_name = newUser.f2;
      newUser.last_name = newUser.f3;
      newUser.email = newUser.f4;

      newUser.token = jwt.sign({ user_id: newUser.id, email }, process.env.TOKEN_KEY, {
        expiresIn: '3h',
      });

      res.status(201).json(userFrom(newUser));
    } else {
      // Returning Oauth sign in
      user.token = jwt.sign({ user_id: user.id, email }, process.env.TOKEN_KEY, {
        expiresIn: '3h',
      });

      res.status(201).json(userFrom(user));
    }
  },
};
