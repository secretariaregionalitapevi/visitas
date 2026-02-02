
async function getChurches(app) {

  try {
    const query = `SELECT c.id, c.name, ci.id as city_id, ci.name as city FROM churches c
      INNER JOIN cities ci ON ci.id = c.city_id
      WHERE ci.id NOT IN(1,2,7)
      ORDER BY ci.name, c.id ASC;`;
    const [results] = await app.connection.query(query);

    return results
  }
  catch (error) {
    console.log(error)
    throw error;
  }
}

async function getChurchesByUser(app, userId) {
  try {
    const cityQuery = `
      SELECT ci.id
      FROM user_cities uc
      INNER JOIN cities ci ON ci.id = uc.city_id
      WHERE uc.user_id = $1;  
    `;

    const [cities] = await app.connection.query(cityQuery, [userId]);

    if (cities.length === 0) {
      return [];
    }

    const cityIds = cities.map(city => city.id);

    // PostgreSQL: usa ANY(array) ao invés de IN (?)
    const churchQuery = `
      SELECT c.id, c.name, ci.id as city_id, ci.name as city
      FROM churches c
      INNER JOIN cities ci ON ci.id = c.city_id
      WHERE ci.id = ANY($1::int[]) 
      ORDER BY ci.name, c.id ASC;
    `;

    const [churches] = await app.connection.query(churchQuery, [cityIds]);

    return churches;
  } catch (error) {
    console.log(error);
    throw error;
  }
}


module.exports = {
  getChurches,
  getChurchesByUser
};
