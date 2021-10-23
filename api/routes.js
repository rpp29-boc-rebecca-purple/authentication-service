const router = require('express').Router();
const controllers = require('./controllers');
const auth = require('./middleware').auth;

// EXAMPLES (Each route has a controller)
router.post('/register', controllers.register);
router.post('/login', controllers.login);
router.get('/auth', auth, controllers.isAuthenticated);

module.exports = router;