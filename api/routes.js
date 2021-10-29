const router = require('express').Router();
const controllers = require('./controllers');
const auth = require('./middleware').auth;

// EXAMPLES (Each route has a controller)
router.post('/register', controllers.register);
router.post('/login', controllers.login);
router.get('/auth', auth, controllers.isAuthenticated);
router.post('/changePassword', auth, controllers.changePassword);

module.exports = router;