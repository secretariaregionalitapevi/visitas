
function isAdmin(req, res, next) {
    if (!req.session.isLoggedIn || req.session.role !== 'admin') {
        console.log(`Tentativa de acesso não autorizado à rota administrativa por ${req.session.email || 'usuário não autenticado'}`);
        return res.status(403).render('error', { 
            layout: false, 
            type: 'danger', 
            message: "Acesso não autorizado. Apenas administradores podem acessar esta área." 
        });
    }
    next();
}

module.exports = isAdmin; 