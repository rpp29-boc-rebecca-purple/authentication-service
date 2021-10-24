const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../service');

module.exports = {
  register: (req, res) => {
    const { first_name, last_name, email, password } = req.body;

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
          const userResult = await db.createUser(req.body, password_hash);
          const user = userResult.rows[0].up_user_create;

          user.id = user.f1;
          user.first_name = user.f2;
          user.last_name = user.f3;
          user.email = user.f4;

          delete user.f1;
          delete user.f2;
          delete user.f3;
          delete user.f4;
          delete user.f5;

          user.token = jwt.sign({ user_id: user.id, email }, process.env.TOKEN_KEY, {
            expiresIn: '1h',
          });

          delete user.password_hash;

          res.status(201).json(user);
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
        expiresIn: '1h',
      });

      delete user.password_hash;

      res.status(201).json(user);
    }

    res.status(400).send('Invalid Credentials');
  },

  isAuthenticated: (req, res) => {
    res.status(200).send('OK');
  },
};
