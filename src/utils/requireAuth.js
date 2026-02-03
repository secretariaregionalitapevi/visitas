// Middleware para proteger rotas que necessitam de autenticação
function requireAuth(req, res, next) {
  if (!req.session || !req.session.isLoggedIn) {
    // Log to help debugging when redirects happen
    console.log('requireAuth: unauthenticated request', { method: req.method, url: req.originalUrl, ip: req.ip });
    req.session.returnTo = req.originalUrl || '/';
    console.log('requireAuth: setting session.returnTo =', req.session.returnTo);
    return res.redirect('/restrito/acesso');
  }
  next();
}

module.exports = requireAuth;
