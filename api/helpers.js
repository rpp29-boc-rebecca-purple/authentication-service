module.exports = {
  userFrom: dbUser => {
    return {
      username: dbUser.username,
      first_name: dbUser.first_name,
      last_name: dbUser.last_name,
      email: dbUser.email,
      token: dbUser.token,
    };
  },
};
