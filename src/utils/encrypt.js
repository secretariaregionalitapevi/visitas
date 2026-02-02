const bcrypt = require('bcryptjs');

async function generateHash(password) {
    const saltRounds = 10;
    const hash = await bcrypt.hash(password, saltRounds);
    return hash;
}

async function comparePassword(password, hash) {
    const match = await bcrypt.compare(password, hash);
    return match;
}

module.exports = { generateHash, comparePassword};
