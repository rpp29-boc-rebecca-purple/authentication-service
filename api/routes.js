const router = require('express').Router();
const controllers = require('./controllers');
const auth = require('./middleware').auth;

// EXAMPLES (Each route has a controller)
router.post('/register', controllers.register);
router.post('/login', controllers.login);
router.post('/changepassword', auth, controllers.changePassword);
router.post('/oauth/connect', controllers.oauth);

router.get('/auth', auth, controllers.isAuthenticated);

module.exports = router;