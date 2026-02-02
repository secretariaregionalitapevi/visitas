const userService = require('../services/users');
const churchesService = require('../services/churches')

async function changePassword(req, res) {
    const { newPassword, confirmPassword } = req.body;

    try {
        if (!confirmPassword || !newPassword) {
            return res.status(400).render('error', {
                type: 'warning',
                layout: false,
                message: "Todos os campos são obrigatórios.",
                role: req.session.role
                
            });
        }

        if (newPassword !== confirmPassword) {
            return res.status(400).render('error', {
                type: 'warning',
                layout: false,
                message: "As senhas não coincidem.",
                role: req.session.role
            });
        }

        await userService.changePasswordService(req.app, req.session.userId, newPassword)
        return res.status(200).json({
            type: 'success',
            message: 'Senha alterada com sucesso!'
        });

    } catch (err) {
        console.error('Erro ao processar a requisição:', err);

        if (err.code === 'ER_BAD_DB_ERROR') {
            return res.status(500).render('error', {
                layout: false,
                type: 'danger',
                message: "Erro no banco de dados. Tente novamente mais tarde.",
                role: req.session.role
            });
        }

        return res.status(500).render('error', {
            layout: false,
            type: 'danger',
            message: "Ocorreu um erro ao processar sua solicitação. Tente novamente mais tarde."
        });
    }
}

async function appUserInfo(req, res) {

    if (req.session.isLoggedIn) {
        logger('USUÁRIOS', req.session.email);
        try {

            const churches = await churchesService.getChurchesByUser(req.app, req.session.userId)

            res.render('private/user', { activePage: 'user', churches: churches, obs:req.session.obs, username: req.session.username, cities: req.session.cities, email: req.session.email, last_login: req.session.last_login, role: req.session.role });
        } catch (err) {
            console.error('Erro ao buscar registros:', err);
            res.status(500).render('error', { layout: false, type: 'danger', message: "Erro ao buscar os registros. Tente novamente mais tarde.", role: req.session.role });
        }
    } else {
        res.redirect('/restrito/acesso');
    }
}
//* *********** ONLY ADMIN **************** */
async function listUsers(req, res) {
    try {
        if (!req.session.isLoggedIn || req.session.role !== 'admin') {
            return res.status(403).render('error', { 
                layout: false, 
                type: 'danger', 
                message: "Acesso não autorizado.",
                role: req.session.role
            });
        }

        const users = await userService.listUsersService(req.app);
        res.render('private/admin/users', { 
            users,
            user: {
                email: req.session.email,
                role: req.session.role
            },
            title: 'Gerenciamento de Usuários',
            activePage: 'admin',
            role: req.session.role
        });
    } catch (error) {
        console.error('Erro ao listar usuários:', error);
        res.status(500).render('error', { 
            layout: false, 
            type: 'danger', 
            message: "Erro ao carregar usuários.",
            role: req.session.role
        });
    }
}

async function createUserForm(req, res) {
    try {
        if (!req.session.isLoggedIn || req.session.role !== 'admin') {
            return res.status(403).render('error', { 
                layout: false, 
                type: 'danger', 
                message: "Acesso não autorizado.",
                role: req.session.role
            });
        }

        const cities = await userService.getCitiesService(req.app);
        
        res.render('private/admin/create-user', { 
            cities,
            user: {
                email: req.session.email,
                role: req.session.role
            },
            title: 'Criar Novo Usuário',
            activePage: 'admin',
            role: req.session.role
        });
    } catch (error) {
        console.log('Erro ao carregar formulário:', error);
        res.status(500).render('error', { 
            layout: false, 
            type: 'danger', 
            message: "Erro ao carregar formulário.",
            role: req.session.role
        });
    }
}

async function createUser(req, res) {
    try {
        if (!req.session.isLoggedIn || req.session.role !== 'admin') {
            return res.status(403).render('error', { 
                layout: false, 
                type: 'danger', 
                message: "Acesso não autorizado.",
                role: req.session.role
            });
        }

        const { name, email, password, role, cities } = req.body;
        
        if (!name || !email || !password || !role) {
            return res.status(400).render('error', { 
                layout: false, 
                type: 'danger', 
                message: "Todos os campos são obrigatórios.",
                role: req.session.role
            });
        }

        await userService.createUserService(req.app, { name, email, password, role, cities });
        res.redirect('/restrito/admin/users');
    } catch (error) {
        console.log('Erro ao criar usuário:', error);
        
        if (error.message === 'Este e-mail já está cadastrado.') {
            return res.status(400).render('error', { 
                layout: false, 
                type: 'danger', 
                message: error.message,
                role: req.session.role
            });
        }

        res.status(500).render('error', { 
            layout: false, 
            type: 'danger', 
            message: "Erro ao criar usuário.",
            role: req.session.role
        });
    }
}


module.exports = { changePassword, appUserInfo, listUsers, createUserForm, createUser };
