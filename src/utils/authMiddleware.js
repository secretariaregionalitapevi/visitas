
function addAuthToResponse(req, res, next) {
    res.locals.isAuthenticated = req.session.isLoggedIn || false;
    res.locals.email = req.session.email || null;
    res.locals.username = req.session.username || null;
    res.locals.last_login = req.session.last_login || null;
    // Garantir tipos esperados pelas views (evita errors de forEach quando undefined)
    res.locals.cities = Array.isArray(req.session.cities) ? req.session.cities : [];
    res.locals.permissions = Array.isArray(req.session.permissions) ? req.session.permissions : [];
    res.locals.userId = req.session.userId || null;
    res.locals.acceptLgpd = req.session.acceptLgpd || false
    next();
}

module.exports = addAuthToResponse;
