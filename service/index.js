const { Pool } = require('pg');

// Uses environment variables for config
const pool = new Pool();

module.exports = {
  userExists(email) {
    let q = `select up_user_exists('${email}')`;

    return pool.query(q);
  },

  createUser(user, password_hash) {
    let { email, first_name, last_name} = user;

    let q = `select up_user_create('${email}', '${password_hash}', '${first_name}', '${last_name}')`;

    return pool.query(q);
  },

  getUser(email) {
    let q = `select up_user_get('${email}')`;

    return pool.query(q);
  }
};
