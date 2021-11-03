const bcrypt = require('bcrypt');

const db = require('../service');
const { userFrom, isLoggedIn, attachToken } = require('./helpers');
const axios = require('axios');

module.exports = {
  register: (req, res) => {
    const { first_name, last_name, username, email, password } = req.body;

    if (!(email && password)) {
      res.status(400).send('Both email and password are required.');
      return;
    }

    db.userExists(email)
      .then(async result => {
        let exists = result.rows[0].up_user_exists;

        if (exists) {
          res.status(409).send('User already exists');
          return;
        } else {
          const password_hash = await bcrypt.hash(password, 10);
          const userResult = await db.createUser({ ...req.body, oauth: false }, password_hash);
          const user = userFrom(userResult.rows[0].up_user_create);

          attachToken(user);

          res.status(201).json(user);
        }
      })
      .catch(err => {
        res.status(400).send(err);
        return;
      });
  },

  login: async (req, res) => {
    const { email, password } = req.body;

    if (!(email && password)) {
      res.status(400).send('Both email and password are required.');
      return;
    }

    const userResult = await db.getUserByEmail(email);
    const password_hash = userResult.rows?.[0]?.up_user_get_email?.[0].password_hash;
    const user = userFrom(userResult.rows?.[0]?.up_user_get_email?.[0]);

    if (user && (await bcrypt.compare(password, password_hash))) {
      attachToken(user);

      res.status(200).json(user);
    } else {
      res.status(400).send('Invalid Credentials');
    }
  },

  deactivate: (req, res) => {
    let { userId } = req.body;

    if (!isLoggedIn(req)) {
      res.status(403).send('User credentials do not match access token');
    }

    db.deactivateUser(userId)
      .then(() => {
        res.status(200).send('OK');
      })
      .catch(err => {
        res.status(400).send(err);
      });
  },

  authentication: (req, res) => {
    if (!isLoggedIn(req)) {
      res.status(403).send('User credentials do not match access token');
    }

    db.getUser(req.user.userId)
      .then(response => {
        let user = userFrom(response.rows[0].up_user_get?.[0]);
        attachToken(user);

        res.status(200).send(user);
      })
      .catch(err => {
        console.error(err);
      });
  },

  changePassword: async (req, res) => {
    const { userId, oldPassword, newPassword } = req.body;

    if (!userId || !oldPassword || !newPassword) {
      res.status(401).send('Provide a user id, new password, and old password');
    }

    if (!isLoggedIn(req)) {
      res.status(403).send('User credentials do not match access token');
    }

    const userResult = await db.getUser(userId);
    const user = userResult.rows?.[0]?.up_user_get?.[0];
    const oldPasswordHash = user.password_hash;

    if (user.oauth) {
      res.status(401).send('Cannot change password for an OAuth user');
    }

    if (oldPassword && (await bcrypt.compare(oldPassword, oldPasswordHash))) {
      let newHash = await bcrypt.hash(newPassword, 10);

      const editResult = await db.editUser(userId, { password_hash: newHash });

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
    const userResult = await db.getUser(userId);
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

      attachToken(newUser);

      res.status(201).json(userFrom(newUser));
    } else {
      // Returning Oauth sign in
      attachToken(user);

      res.status(201).json(userFrom(user));
    }
  },
};
