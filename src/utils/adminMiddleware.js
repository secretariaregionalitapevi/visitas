
const { isAdminRole } = require('./roleUtils');

function isAdmin(req, res, next) {
    if (!req.session.isLoggedIn) {
        // Not authenticated: store return url and redirect to login
        req.session.returnTo = req.originalUrl || '/';
        return res.redirect('/restrito/acesso');
    }

    if (!isAdminRole(req.session.role)) {
        return res.status(403).render('error', { 
            layout: false, 
            type: 'danger', 
            message: "Acesso não autorizado. Apenas administradores podem acessar esta área." 
        });
    }
    next();
}

module.exports = isAdmin; 