const jwt = require('jsonwebtoken');

module.exports = {
  userFrom: u => {
    if (!u) {
      return;
    }

    return {
      userId: u.userId || u.user_id || u.id || u.f1,
      username: u.username || u.f2 || '',
      firstName: u.first_name || u.f3 || '',
      lastName: u.last_name || u.f4 || '',
      email: u.email || u.f5,
      age: u.age || u.f6 || null,
      snack: u.snack || u.f7 || null,
      animalType: u.animal_type || u.f8 || null,
      followerCount: u.follower_count ?? u.f9,
      followingCount: u.following_count ?? u.f10,
      oauth: u.oauth ?? u.f11,
      token: u.token,
    };
  },

  isLoggedIn: req => {
    if (req.body.userId === req.user.userId) {
      return true;
    }
    return false;
  },

  issueToken: user => {
    user.token = jwt.sign({ userId: user.userId, email: user.email, username: user.username }, process.env.TOKEN_KEY, {
      expiresIn: process.env.JWT_EXPIRY,
    });
  },
};
