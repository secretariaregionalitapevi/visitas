const encrypt = require('../utils/encrypt');

const changePasswordService = async function (app, userId, password,) {

    try {

        const passwordHash = await encrypt.generateHash(password)
        const changePasswordQuery = 'UPDATE users SET password = $1 WHERE id = $2';
        const result = await app.connection.query(changePasswordQuery, [passwordHash, userId]);

        if (result[1].affectedRows === 0) {
            throw new Error('Não foi possível atualizar a senha.');
        }

        return { message: 'Senha alterada com sucesso!' };

    } catch (error) {
        console.error('error ::authenticateUser::', error);
        throw error;
    }
};

const listUsersService = async function (app) {
    try {
        // PostgreSQL: STRING_AGG ao invés de GROUP_CONCAT
        const query = ` SELECT u.*, STRING_AGG(c.name, ', ') as cities FROM users u LEFT JOIN user_cities uc ON u.id = uc.user_id LEFT JOIN cities c ON uc.city_id = c.id GROUP BY u.id `;
        const [users] = await app.connection.query(query);
        return users;
    } catch (error) {
        console.error('error ::listUsersService::', error);
        throw error;
    }
};
const getCitiesService = async function (app) {
    try {
        const query = 'SELECT * FROM cities ORDER BY name';
        const [cities] = await app.connection.query(query);
        return cities;
    } catch (error) {
        console.error('error ::getCitiesService::', error);
        throw error;
    }
};
const createUserService = async function (app, userData) {
    try {
        const {
            name,
            email,
            password,
            role,
            cities
        } = userData;

        const checkEmailQuery = 'SELECT id FROM users WHERE email = $1';
        const [existingUser] = await app.connection.query(checkEmailQuery, [email]);

        if (existingUser.length > 0) {
            throw new Error('Este e-mail já está cadastrado.');
        }
        // Hash da senha
        const passwordHash = await encrypt.generateHash(password);
        const insertUserQuery = 'INSERT INTO users (username, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id';
        const [result] = await app.connection.query(insertUserQuery, [name, email, passwordHash, role]);
        
        // PostgreSQL: insertId vem do RETURNING
        const userId = result[0]?.id;
        
        // Associa cidades
        if (cities && cities.length > 0) {
            const citiesArray = Array.isArray(cities) ? cities : [cities];
            // PostgreSQL: inserção múltipla usa VALUES separados
            const values = citiesArray.map((cityId, index) => `($1, $${index + 2})`).join(', ');
            const params = [userId, ...citiesArray];
            const insertCitiesQuery = `INSERT INTO user_cities (user_id, city_id) VALUES ${values}`;
            await app.connection.query(insertCitiesQuery, params);
        }
        return {
            success: true,
            userId: userId
        };
    } catch (error) {
        console.error('error ::createUserService::', error);
        throw error;
    }
};
module.exports = {
    changePasswordService,
    listUsersService,
    getCitiesService,
    createUserService
};