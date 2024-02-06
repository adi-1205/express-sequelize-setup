const passport = require('passport');
module.exports = 

module.exports = (req, res, next) => {
    passport.authenticate('jwt', { session: false }, (err, user) => {
        if (err) {
          return next(err);
        }
        if (!user) {
          return res.redirect('/auth/login');
        }
        if (user.role === 'admin') {
          return res.redirect('/auth/login');
        }
        next();
      })(req, res, next);
}