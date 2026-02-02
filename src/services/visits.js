const UAParser = require('ua-parser-js');
const parser = new UAParser();

async function registerVisit(app, object) {
  const { month, city, church, gvi, gvm, rf, re, ip, os, browser } = object;

  const query = `
    INSERT INTO visits (month, city_id, church_id, gvi, gvm, rf, re, ip, os, browser)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    RETURNING id
  `;

  const insertValues = [month, city, church, gvi, gvm, rf, re, ip, os, browser];

  try {
    const [insertResults] = await app.connection.query(query, insertValues);

    if (!insertResults || insertResults.length === 0) {
      throw new Error('Failed to insert visit record')
    }
  } catch (err) {
    console.error(err);
    throw err
  }
}

async function chartVisitsTotalByUser(app, userId, month) {

  try {
    const query =
      `SELECT ci.name AS city, SUM(v.gvi + v.gvm + v.re + v.rf) AS total
        FROM visits v
        left JOIN churches c ON c.id = v.church_id
        left JOIN cities ci ON ci.id = v.city_id   
        INNER JOIN 
            user_cities uc ON uc.city_id = ci.id   
        WHERE 
            uc.user_id = $1  
            and  v.month = $2        
      GROUP BY ci.name
      ORDER BY total DESC; `

    const [results] = await app.connection.query(query, [userId, month]);

    return results
  } catch (err) {
    console.error('Erro ao buscar registros:', err);
    throw err
  }

}

async function chartVisitsCountCityByUser(app, userId, month) {

  try {
    const query =
      `SELECT ci.name AS city, COUNT(v.id) AS total
      FROM visits v
      LEFT JOIN churches c ON c.id = v.church_id
      LEFT JOIN cities ci ON ci.id = v.city_id
      INNER JOIN user_cities uc ON uc.city_id = ci.id
      WHERE uc.user_id = $1  
      AND v.month = $2
      GROUP BY ci.name
      ORDER BY total DESC;`;

    const [results] = await app.connection.query(query, [userId, month]);

    return results
  } catch (err) {
    console.error('Erro ao buscar registros:', err);
    throw err
  }

}

async function chartsVisitsTypeByUser(app, userId, month) {
  try {
    const query =
      `SELECT 
            c.name AS city,           
            COALESCE(SUM(v.gvi), 0) AS total_gvi, 
            COALESCE(SUM(v.gvm), 0) AS total_gvm,
            COALESCE(SUM(v.rf), 0) AS total_rf,
            COALESCE(SUM(v.re), 0) AS total_re
        FROM 
            cities c
        LEFT JOIN 
            churches ch ON ch.city_id = c.id
        LEFT JOIN 
            visits v ON v.church_id = ch.id AND (v.month = $1 OR $1 IS NULL)
        INNER JOIN 
            user_cities uc ON uc.city_id = c.id   
        WHERE 
            uc.user_id = $2                      
        GROUP BY 
            c.name
        ORDER BY 
            c.name;`;

    const [results] = await app.connection.query(query, [month, userId]);

    return results
  } catch (err) {
    console.error('Erro ao buscar registros:', err);
    throw err
  }

}

async function listChurchesWithoutRecordLastTwoMonths(app, userId) {
  try {
    // PostgreSQL: calcula o mês de 2 meses atrás
    const twoMonthsAgoMonth = new Date();
    twoMonthsAgoMonth.setMonth(twoMonthsAgoMonth.getMonth() - 2);
    const monthThreshold = twoMonthsAgoMonth.getMonth() + 1; // +1 porque getMonth() retorna 0-11
    
    let query =
      `SELECT ch.*, c.name AS city
        FROM churches ch
        LEFT JOIN cities c ON ch.city_id = c.id
        LEFT JOIN visits v ON v.church_id = ch.id 
          AND v.month >= $1
        LEFT JOIN user_cities uc_city ON uc_city.user_id = $2 AND uc_city.city_id = c.id
        LEFT JOIN user_churches uc_church ON uc_church.user_id = $3 AND uc_church.church_id = ch.id
        WHERE (uc_city.user_id IS NOT NULL OR uc_church.user_id IS NOT NULL)
        AND v.id IS NULL;`

    const [results] = await app.connection.query(query, [monthThreshold, userId, userId]);

    return results
  } catch (err) {
    console.error('Erro ao buscar registros:', err);
    throw err
  }

}

async function listVisitsByUser(app, userId, city_id = null, month = null) {
  let query = `
     SELECT 
        v.*, 
        c.name AS city, 
        ch.name AS church, 
        CASE
            WHEN v.month = 1 THEN 'Janeiro'
            WHEN v.month = 2 THEN 'Fevereiro'
            WHEN v.month = 3 THEN 'Março'
            WHEN v.month = 4 THEN 'Abril'
            WHEN v.month = 5 THEN 'Maio'
            WHEN v.month = 6 THEN 'Junho'
            WHEN v.month = 7 THEN 'Julho'
            WHEN v.month = 8 THEN 'Agosto'
            WHEN v.month = 9 THEN 'Setembro'
            WHEN v.month = 10 THEN 'Outubro'
            WHEN v.month = 11 THEN 'Novembro'
            WHEN v.month = 12 THEN 'Dezembro'
        END AS month
    FROM visits v
    INNER JOIN churches ch ON v.church_id = ch.id
    LEFT JOIN cities c ON ch.city_id = c.id
    LEFT JOIN user_cities uc_city ON uc_city.user_id = $1 AND uc_city.city_id = c.id
    LEFT JOIN user_churches uc_church ON uc_church.user_id = $2 AND uc_church.church_id = ch.id
    WHERE (uc_city.user_id IS NOT NULL OR uc_church.user_id IS NOT NULL)`;

  const params = [userId, userId];  
  let paramIndex = 3;
  if (city_id !== null) {
    query += ` AND c.id = $${paramIndex}`;
    params.push(city_id);
    paramIndex++;
  }

  if (month !== null) {
    query += ` AND v.month = $${paramIndex}`;
    params.push(month);
    paramIndex++;
  }

  query += ' ORDER BY v.month ASC;'; 

  const [results] = await app.connection.query(query, params);
  return results;
}
async function listGroupedVisits(app, userId, city_id = null, month = null) {
  let query = '';
  let params = []
  if (city_id === null) {
    params = [userId, userId];

    query = `
      SELECT 
        COALESCE(c.name, 'Total') AS city,
        SUM(v.gvi) AS gvi,
        SUM(v.gvm) AS gvm,
        SUM(v.rf) AS rf,
        SUM(v.re) AS re,
        (SUM(v.gvi) + SUM(v.gvm) + SUM(v.rf) + SUM(v.re)) AS amount
      FROM visits v
      INNER JOIN churches ch ON v.church_id = ch.id
      LEFT JOIN cities c ON ch.city_id = c.id
      LEFT JOIN user_cities uc_city ON uc_city.user_id = $1 AND uc_city.city_id = c.id
      LEFT JOIN user_churches uc_church ON uc_church.user_id = $2 AND uc_church.church_id = ch.id
      WHERE (uc_city.user_id IS NOT NULL OR uc_church.user_id IS NOT NULL)
    `;

    if (month !== null) {
      query += ' AND v.month = $3';
      params.push(month);
    }

    // PostgreSQL: GROUPING SETS ao invés de WITH ROLLUP
    query += ` GROUP BY GROUPING SETS ((c.name), ()) ORDER BY city NULLS LAST`;

  } else {
    query = `
    SELECT 
      ch.name AS church,
      c.name AS city,
      COALESCE(SUM(v.gvi), 0) AS gvi,
      COALESCE(SUM(v.gvm), 0) AS gvm,
      COALESCE(SUM(v.rf), 0) AS rf,
      COALESCE(SUM(v.re), 0) AS re,
      COALESCE(SUM(v.gvi) + SUM(v.gvm) + SUM(v.rf) + SUM(v.re), 0) AS amount
    FROM churches ch
    LEFT JOIN cities c ON ch.city_id = c.id
    LEFT JOIN visits v ON v.church_id = ch.id  AND v.month = $1
    LEFT JOIN user_cities uc_city ON uc_city.user_id = $2 AND uc_city.city_id = c.id
    LEFT JOIN user_churches uc_church ON uc_church.user_id = $3 AND uc_church.church_id = ch.id
    WHERE c.id = $4
      AND (uc_city.user_id IS NOT NULL OR uc_church.user_id IS NOT NULL)
  `;
  params = [month, userId, userId, city_id];

  // PostgreSQL: GROUPING SETS ao invés de WITH ROLLUP
  query += ` GROUP BY GROUPING SETS ((ch.name), ()) ORDER BY church NULLS LAST`;
 
  }
  const [results] = await app.connection.query(query, params);
  return results;
}  


async function listVisitsPendingByUser(app, userId, city_id = null, month = null) {
  // Se nenhum mês for especificado, usa o mês anterior
  const currentDate = new Date();
  const currentMonth = month || (currentDate.getMonth() === 0 ? 12 : currentDate.getMonth());

  let query = `
      SELECT 
          c.name AS city, 
        ch.name AS church, 
          COALESCE(
              CASE
                  WHEN v.month = 1 THEN 'Janeiro'
                  WHEN v.month = 2 THEN 'Fevereiro'
                  WHEN v.month = 3 THEN 'Março'
                  WHEN v.month = 4 THEN 'Abril'
                  WHEN v.month = 5 THEN 'Maio'
                  WHEN v.month = 6 THEN 'Junho'
                  WHEN v.month = 7 THEN 'Julho'
                  WHEN v.month = 8 THEN 'Agosto'
                  WHEN v.month = 9 THEN 'Setembro'
                  WHEN v.month = 10 THEN 'Outubro'
                  WHEN v.month = 11 THEN 'Novembro'
                  WHEN v.month = 12 THEN 'Dezembro'
              END,
              'Sem lançamento'
          ) AS month
      FROM churches ch
      LEFT JOIN cities c ON ch.city_id = c.id
      LEFT JOIN visits v ON v.church_id = ch.id AND v.month = $1
      LEFT JOIN user_cities uc_city ON uc_city.user_id = $2 AND uc_city.city_id = c.id
      LEFT JOIN user_churches uc_church ON uc_church.user_id = $3 AND uc_church.church_id = ch.id
      WHERE (uc_city.user_id IS NOT NULL OR uc_church.user_id IS NOT NULL) 
    `;

  const params = [currentMonth, userId, userId];  
  let paramIndex = 4;

  if (city_id !== null) {
    query += ` AND c.id = $${paramIndex}`;
    params.push(city_id);
    paramIndex++;
  }

  query += '  AND v.id IS NULL ORDER BY ch.name ASC;'; 

  const [results] = await app.connection.query(query, params);
  return results;
}


async function getHousesOfPrayerStats(app, userId, month) {
  try {
    const query = `
      SELECT
        c.name AS city,
        COUNT(DISTINCT ch.id) AS total_houses,
        COUNT(DISTINCT CASE WHEN v.id IS NOT NULL THEN ch.id END) AS filled_houses,
        ROUND((COUNT(DISTINCT CASE WHEN v.id IS NOT NULL THEN ch.id END)::numeric / NULLIF(COUNT(DISTINCT ch.id), 0)) * 100, 2) AS fill_percentage
      FROM cities c
      INNER JOIN user_cities uc ON uc.city_id = c.id
      LEFT JOIN churches ch ON ch.city_id = c.id
      LEFT JOIN visits v ON v.church_id = ch.id AND v.month = $1
      WHERE uc.user_id = $2
      GROUP BY c.name
      ORDER BY fill_percentage DESC;
    `;

    const [results] = await app.connection.query(query, [month, userId]);
    return results;
  } catch (err) {
    console.error('Erro ao buscar estatísticas das casas de oração:', err);
    throw err;
  }
}

async function getVisitById(app, id) {
    const query = `
        SELECT v.*, ch.id as church_id, ch.name as church_name
        FROM visits v
        INNER JOIN churches ch ON v.church_id = ch.id
        WHERE v.id = $1
    `;
    const [results] = await app.connection.query(query, [id]);
    return results[0];
}

async function canEditVisit(app, visitId) {
    const visit = await getVisitById(app, visitId);
    if (!visit) {
        throw new Error('Lançamento não encontrado');
    }

    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1; // Mês atual (1-12)
    const currentYear = currentDate.getFullYear();

    // Calcula o mês limite (2 meses atrás)
    let limitMonth = currentMonth - 2;
    let limitYear = currentYear;
    
    if (limitMonth <= 0) {
        limitMonth += 12;
        limitYear -= 1;
    }

    // Converte o mês do registro para um número
    const recordMonth = parseInt(visit.month);
    
    // Se o mês do registro for maior que o mês atual, assume que é do ano anterior
    const recordYear = recordMonth > currentMonth ? currentYear - 1 : currentYear;

    // Verifica se o registro está dentro do limite de 2 meses
    if (recordYear < limitYear || (recordYear === limitYear && recordMonth < limitMonth)) {
        return false;
    }

    return true;
}

async function updateVisit(app, id, data) {
    // Verifica se pode editar
    const canEdit = await canEditVisit(app, id);
    if (!canEdit) {
        throw new Error('Não é possível editar registros com mais de 2 meses. Procurar o administrador do sistema.');
    }

    const query = `
        UPDATE visits 
        SET gvi = $1, gvm = $2, rf = $3, re = $4
        WHERE id = $5
    `;
    await app.connection.query(query, [
        data.gvi,
        data.gvm,
        data.rf,
        data.re,
        id
    ]);
}

async function deleteVisit(app, id, userId) {
    // Verifica se pode excluir
    const canEdit = await canEditVisit(app, id);
    if (!canEdit) {
        throw new Error('Não é possível excluir registros com mais de 2 meses. Procurar o administrador do sistema.');
    }

    // Primeiro, buscar o church_id do lançamento
    const visit = await getVisitById(app, id);
    if (!visit) {
        throw new Error('Lançamento não encontrado');
    }

    try {
        // Registrar o log antes de excluir
        await logVisitAction(app, id, userId, 'DELETE');

        // Excluir o lançamento
        const deleteVisitQuery = 'DELETE FROM visits WHERE id = $1';
        await app.connection.query(deleteVisitQuery, [id]);
    } catch (error) {
        console.error('Erro ao excluir:', error);
        throw error;
    }
}

async function logVisitAction(app, visitId, userId, action) {
    // Primeiro, buscar o church_id do lançamento
    const visit = await getVisitById(app, visitId);
    if (!visit) {
        throw new Error('Lançamento não encontrado');
    }

    const query = `
        INSERT INTO visits_log (visit_id, church_id, user_id, action)
        VALUES ($1, $2, $3, $4)
    `;
    await app.connection.query(query, [visitId, visit.church_id, userId, action]);
}


/**
 * Busca dados do gráfico agrupados por município (para usuários com múltiplos municípios)
 */
async function getBarChartDataByMunicipality(app, userId, month) {
  try {
      const query = `
          SELECT 
              ci.name AS label,
              SUM(v.gvi + v.gvm + v.rf + v.re) AS total
          FROM cities ci
          INNER JOIN user_cities uc ON uc.city_id = ci.id
          LEFT JOIN churches ch ON ch.city_id = ci.id
          LEFT JOIN visits v ON v.church_id = ch.id AND v.month = $1
          WHERE uc.user_id = $2
          GROUP BY ci.id, ci.name
          ORDER BY total DESC
      `;
      const [results] = await app.connection.query(query, [month, userId]);
      return results;
  } catch (err) {
      console.error('Erro ao buscar dados do gráfico por município:', err);
      throw err;
  }
}

/**
* Busca dados do gráfico agrupados por igreja (para usuários com apenas um município)
*/
async function getBarChartDataByChurch(app, userId, month) {
  try {
      const query = `
          SELECT 
              ch.name AS label,
              COALESCE(SUM(v.gvi + v.gvm + v.rf + v.re), 0) AS total
          FROM churches ch
          INNER JOIN cities ci ON ci.id = ch.city_id
          INNER JOIN user_cities uc ON uc.city_id = ci.id
          LEFT JOIN visits v ON v.church_id = ch.id AND v.month = $1
          WHERE uc.user_id = $2
          GROUP BY ch.id, ch.name
          ORDER BY total DESC
      `;
      const [results] = await app.connection.query(query, [month, userId]);
      return results;
  } catch (err) {
      console.error('Erro ao buscar dados do gráfico por igreja:', err);
      throw err;
  }
}

async function listNoServiceReport(app, userId, cityId = null) {
  const now = new Date();
  const currentMonth = now.getMonth();
  
  // Calcula os últimos 3 meses
  const months = [];
  for (let i = 2; i >= 0; i--) {
      let month = currentMonth - i;
      if (month <= 0) {
          month += 12;
      }
      months.push(month);
  }

  console.log(months);

  // PostgreSQL: usa array ao invés de string separada por vírgula
  let query = `
      WITH filtrado AS (
          SELECT v.church_id,
                 v.city_id,
                 c.name AS church_name,
                 ct.name AS city_name,
                 v.month,
                 v.gvi,
                 v.gvm,
                 v.re,
                 v.rf
          FROM visits v
          INNER JOIN churches c ON c.id = v.church_id
          INNER JOIN cities ct ON ct.id = v.city_id
          INNER JOIN user_cities uc ON uc.city_id = ct.id
          WHERE uc.user_id = $1
            AND v.month = ANY($2::int[])
            ${cityId ? 'AND v.city_id = $3' : ''}
      )
      SELECT 
          city_id,
          city_name as city,
          church_name as church,
          CASE 
              WHEN SUM(CASE WHEN gvi = 0 THEN 1 ELSE 0 END) = COUNT(*) 
              THEN 'SEM SERVIÇO'
              ELSE ''
          END AS gvi,
          CASE 
              WHEN SUM(CASE WHEN gvm = 0 THEN 1 ELSE 0 END) = COUNT(*) 
              THEN 'SEM SERVIÇO'
              ELSE ''
          END AS gvm,
          CASE 
              WHEN SUM(CASE WHEN re = 0 THEN 1 ELSE 0 END) = COUNT(*) 
              THEN 'SEM SERVIÇO'
              ELSE ''
          END AS re,
          CASE 
              WHEN SUM(CASE WHEN rf = 0 THEN 1 ELSE 0 END) = COUNT(*) 
              THEN 'SEM SERVIÇO'
              ELSE ''
          END AS rf
      FROM filtrado
      GROUP BY city_id, city_name, church_name
      HAVING 
             SUM(CASE WHEN gvi = 0 THEN 1 ELSE 0 END) = COUNT(*)
          OR SUM(CASE WHEN gvm = 0 THEN 1 ELSE 0 END) = COUNT(*)
          OR SUM(CASE WHEN re = 0 THEN 1 ELSE 0 END) = COUNT(*)
          OR SUM(CASE WHEN rf = 0 THEN 1 ELSE 0 END) = COUNT(*)
      ORDER BY city_id, church_name;
  `;

  const params = cityId ? [userId, months, cityId] : [userId, months];
  
  const [results] = await app.connection.query(query, params);
  return results; 
}


module.exports = {
  registerVisit,
  listVisitsByUser,
  listVisitsPendingByUser,
  chartsVisitsTypeByUser,
  chartVisitsCountCityByUser,
  chartVisitsTotalByUser,
  listChurchesWithoutRecordLastTwoMonths,
  listGroupedVisits,
  getHousesOfPrayerStats,
  getVisitById,
  updateVisit,
  deleteVisit,
  logVisitAction,
  getBarChartDataByMunicipality,
  getBarChartDataByChurch,
  listNoServiceReport

};
