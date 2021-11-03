const { Pool } = require('pg');

// Uses environment variables for config
const pool = new Pool();

module.exports = {
  userExists(email) {
    let q = `select up_user_exists('${email}')`;

    return pool.query(q);
  },

  createUser(user, password_hash) {
    let { email, first_name, last_name, username, oauth } = user;

    let q = `select up_user_create('${email}', '${password_hash}', '${first_name}', '${last_name}', '${username}', '${oauth}')`;

    return pool.query(q);
  },

  getUser(userId) {
    let q = `select up_user_get(${userId})`;

    return pool.query(q);
  },

  getUserByEmail(email) {
    let q = `select up_user_get_email('${email}')`;

    return pool.query(q);
  },

  deactivateUser(userId) {
    let q = `select up_user_deactivate(${userId})`;

    return pool.query(q);
  },

  deactivateUserByEmail(email) {
    this.getUserByEmail(email).then(res => {
      if (!!res.rows[0].up_user_get_email?.[0].user_id) {
        this.deactivateUser(res.rows[0].up_user_get_email?.[0].user_id);
      }
    });
  },

  editUser(userId, commands) {
    let str = '';

    for (let key in commands) {
      if (typeof commands[key] === 'string') {
        str += `${key} = '${commands[key]}',`;
      } else {
        str += `${key} = ${commands[key]},`;
      }
    }

    let q = `
    update users
      set ${str.slice(0, -1)}
    where
      user_id = ${userId}
    `;

    return pool.query(q);
  },
};
