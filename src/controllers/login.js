const loginService = require('../services/login')
const useragent = require('useragent');
const { isAdminRole } = require('../utils/roleUtils');

function appLogin(req, res) {
    req.session.isLoggedIn = false;
    const returnTo = req.query.returnTo || req.session.returnTo || '';
    res.render('public/login', { layout: false, message: '', returnTo });
}

async function authenticateUser(req, res) {

    const { email, password } = req.body;

    var agent = useragent.parse(req.headers['user-agent']);
    const os = agent.os.toString();
    const deviceModel = agent.device.toString();

    try {
        const response = await loginService.authenticateUserService(req.app, email.trim().toLowerCase(), password);
   
        req.session.isLoggedIn = true;
        req.session.email = email.toLowerCase();
        req.session.username = response.username
        // Não armazenar arrays grandes em cookie-session (tamanho do cookie limitado).
        // Buscar cidades por usuário quando necessário diretamente do DB.
        req.session.userId = response.user_id;
        // Normalize role in session: map numeric or alternate roles to 'admin' or 'user'
        const normalizedRole = isAdminRole(response.role) ? 'admin' : (response.role || 'user');
        req.session.role = normalizedRole;
        req.session.acceptLgpd = response.accept_lgpd
        req.session.last_login = response.last_login
        req.session.os = os;
        req.session.device = deviceModel;
        req.session.obs = response.obs
            // Prefer explicit returnTo for all users
            // Debug: log any returnTo values to diagnose post-login redirect issues
            const incomingReturnToSession = req.session.returnTo;
            const incomingReturnToBody = req.body.returnTo;
            const incomingReturnToQuery = req.query.returnTo;
            const returnTo = incomingReturnToSession || incomingReturnToBody || incomingReturnToQuery;
            console.log('login redirect debug -> session.returnTo=', incomingReturnToSession, 'body.returnTo=', incomingReturnToBody, 'query.returnTo=', incomingReturnToQuery, 'calculated returnTo=', returnTo);

            // Clear saved returnTo
            delete req.session.returnTo;

            if (returnTo) {
                // Log Set-Cookie header for debugging session issuance
                try {
                    const sc = res.getHeader && (res.getHeader('Set-Cookie') || res.getHeader('set-cookie'));
                    console.log('login set-cookie header (before redirect to returnTo)=', sc);
                } catch (e) {
                    console.log('error reading set-cookie header before redirect to returnTo', e && e.message);
                }
                return res.redirect(returnTo);
            }

            // No returnTo: fall back to default dashboard
                // Log Set-Cookie header for debugging session issuance
                try {
                    const sc2 = res.getHeader && (res.getHeader('Set-Cookie') || res.getHeader('set-cookie'));
                    console.log('login set-cookie header (before redirect to /restrito/graficos)=', sc2);
                } catch (e) {
                    console.log('error reading set-cookie header before redirect to /restrito/graficos', e && e.message);
                }
                return res.redirect('/restrito/graficos');

    } catch (error) {
        console.error('login error:', error && error.stack ? error.stack : error);
        var erro_message = "Erro ao logar, contate o suporte."
        if (error && error.status === 401) {
            erro_message = "Senha incorreta."
        } else if (error && error.status === 404) {
            erro_message = "Usuário não cadastrado."
        }

        const returnTo = req.body.returnTo || req.query.returnTo || req.session.returnTo || '';
        return res.render('public/login', { userPermissions: [], layout: false, message: erro_message, returnTo });
    }

}


module.exports = {
    appLogin,
    authenticateUser
};
