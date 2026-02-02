
function addAuthToResponse(req, res, next) {
    res.locals.isAuthenticated = req.session.isLoggedIn || false;
    res.locals.email = req.session.email || null;
    res.locals.username = req.session.username || null;
    res.locals.last_login = req.session.last_login || null;
    res.locals.cities = req.session.cities || null;
    res.locals.permissions = req.session.permissions || []
    res.locals.userId = req.session.userId || []
    res.locals.acceptLgpd = req.session.acceptLgpd || false
    next();
}

module.exports = addAuthToResponse;
