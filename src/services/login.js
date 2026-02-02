const encrypt = require('../utils/encrypt');

const authenticateUserService = async function (app, email, password,) {
    try {
        const userQuery = 'SELECT * FROM users WHERE email = $1';
        const [userResults] = await app.connection.query(userQuery, [email]);

        if (userResults.length === 0) {
            throw {
                status: 404,
                message: 'User not found'
            };
        }

        const user = userResults[0];

        //Compare password
        const passwordMatches = await encrypt.comparePassword(password, user.password);

        if (!passwordMatches) {
            throw {
                status: 401,
                message: 'Password not match'
            };
        }
        const updateLastLoginQuery = 'UPDATE users SET last_login = NOW() WHERE id = $1';
        await app.connection.query(updateLastLoginQuery, [user.id]);

        const query = `SELECT c.name AS city
            FROM cities c
            INNER JOIN user_cities uc ON c.id = uc.city_id
            WHERE uc.user_id = $1
            ORDER BY c.name ASC;`;

        const [citiesResult] = await app.connection.query(query, [user.id]);
    
        const response = {
            user_id: user.id,
            username: user.username.toUpperCase(),
            role: user.role,
            cities: citiesResult,
            obs: user.obs,
            last_login: user.last_login,
            accept_lgpd: user.accept_lgpd
        };

        return response;
    } catch (error) {
        console.error('error ::authenticateUser::', error);
        throw error;
    }
};

module.exports = {
    authenticateUserService
};