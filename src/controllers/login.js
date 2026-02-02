const loginService = require('../services/login')
const useragent = require('useragent');

function appLogin(req, res) {
    req.session.isLoggedIn = false;
    res.render('public/login', { layout: false, message: '' });
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
        req.session.cities = response.cities
        req.session.userId = response.user_id;
        req.session.role = response.role
        req.session.acceptLgpd = response.accept_lgpd
        req.session.last_login = response.last_login
        req.session.os = os;
        req.session.device = deviceModel;
        req.session.obs = response.obs
        console.log('User authenticated: ', req.session)

        return res.redirect('/restrito/graficos');

    } catch (error) {
        console.log(error)
        var erro_message = "Erro ao logar, contate o suporte."
        if (error && error.status === 401) {
            erro_message = "Senha incorreta."
        } else if (error && error.status === 404) {
            erro_message = "Usuário não cadastrado."
        }

        return res.render('public/login', { userPermissions: [], layout: false, message: erro_message });
    }

}


module.exports = {
    appLogin,
    authenticateUser
};