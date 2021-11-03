module.exports = {
  userFrom: u => {
    return {
      userId: u.userId,
      username: u.username,
      first_name: u.first_name,
      last_name: u.last_name,
      email: u.email,
      age: u.age,
      snack: u.snack,
      animal_type: u.animal_type,
      follower_count: u.follower_count,
      following_count: u.following_count,
      oauth: u.oauth,
      token: u.token,
    };
  },

  isLoggedIn: req => {
    if (req.body.userId === req.user.userId) {
      return true;
    }
    return false;
  },
};
