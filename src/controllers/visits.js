// src/controllers/visits.js

const visitService = require('../services/visits');

async function appVisitsIndex(req, res) {
  try {
    // Cidades
    const [cities] = await req.app.connection.query(
      'SELECT id, name FROM public.cities ORDER BY name ASC;'
    );

    // Casas de oração (tabela churches no Supabase)
    // Ajuste para seu EJS usar church.id e church.name
    const [churches] = await req.app.connection.query(`
      SELECT 
        id,
        "COMUM" AS name
      FROM public.churches
      ORDER BY trim(split_part("COMUM", ' - ', 2)) ASC;
    `);

    return res.render("public/index", { cities, churches, layout: false });
  } catch (err) {
    console.error("Erro ao carregar dados:", err);
    return res.render("public/index", { cities: [], churches: [], layout: false });
  }
}

// Controller para registrar um lançamento enviado pelo formulário público
async function registerVisitController(req, res) {
  try {
    const { month, city_id, church, gvi, gvm, rf, re } = req.body || {};

    // Validações básicas
    if (!month || !city_id || !church) {
      return res.status(400).render('error', { layout: false, type: 'danger', message: 'Campos obrigatórios ausentes.' });
    }

    const ua = req.headers['user-agent'] || '';
    const ip = req.ip || req.connection?.remoteAddress || '';

    const payload = {
      month: parseInt(month, 10),
      city: parseInt(city_id, 10),
      church: parseInt(church, 10),
      gvi: parseInt(gvi || 0, 10),
      gvm: parseInt(gvm || 0, 10),
      rf: parseInt(rf || 0, 10),
      re: parseInt(re || 0, 10),
      ip,
      os: ua,
      browser: ua
    };

    await visitService.registerVisit(req.app, payload);

    // Buscar nomes legíveis para feedback
    let churchName = '';
    let cityName = '';
    try {
      const [churchRows] = await req.app.connection.query('SELECT "COMUM" AS name FROM churches WHERE id = $1', [payload.church]);
      const [cityRows] = await req.app.connection.query('SELECT name FROM cities WHERE id = $1', [payload.city]);
      const churchRow = churchRows && churchRows.length ? churchRows[0] : null;
      const cityRow = cityRows && cityRows.length ? cityRows[0] : null;
      churchName = churchRow ? churchRow.name : '';
      cityName = cityRow ? cityRow.name : '';
    } catch (e) {
      // ignore
    }

    const monthNames = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
    const monthName = monthNames[(payload.month - 1 + 12) % 12] || '';

    return res.render('thanks', { layout: false, churchName, cityName, monthName });
  } catch (err) {
    console.error('Erro ao registrar lançamento:', err);
    return res.status(500).render('error', { layout: false, type: 'danger', message: 'Erro ao registrar lançamento.' });
  }
}

async function getVisit(req, res) {
  try {
    // If client expects JSON (AJAX), return visit data for modal/edit
    if (req.accepts('json') || req.xhr || req.headers['accept']?.includes('application/json')) {
      const visit = await visitService.getVisitById(req.app, req.params.id);
      if (!visit) return res.status(404).json({ ok: false, message: 'Registro não encontrado' });
      return res.json(visit);
    }

    // Otherwise redirect to the list page
    return res.redirect('/restrito/visitas');
  } catch (err) {
    console.error('Erro em getVisit controller:', err);
    return res.status(500).json({ ok: false, message: 'Erro ao buscar lançamento' });
  }
}

async function updateVisit(req, res) {
  return res.status(200).json({ ok: true, id: req.params.id });
}

async function deleteVisit(req, res) {
  try {
    const id = req.params.id;
    await visitService.deleteVisit(req.app, id, req.session.userId);
    return res.json({ ok: true });
  } catch (err) {
    console.error('Erro ao deletar visit:', err);
    return res.status(500).json({ ok: false, message: err.message || 'Erro ao excluir' });
  }
}

// Render page de listagem de visitas (grouped)
async function listVisitsPage(req, res) {
  try {
    const userId = req.session.userId;
    const month = req.query.month ? parseInt(req.query.month, 10) : null;
    const city_id = req.query.city_id ? parseInt(req.query.city_id, 10) : null;

    console.log('listVisitsPage called with', { userId, month, city_id });

    const records = await visitService.listGroupedVisits(req.app, userId, city_id, month);
    const recordsPending = await visitService.listVisitsPendingByUser(req.app, userId, city_id, month);

    // Fetch cities for user's select. Se o usuário não tiver assignments, retornar todas as cidades como fallback.
    let [cities] = await req.app.connection.query('SELECT c.id as city_id, c.name as city FROM cities c INNER JOIN user_cities uc ON uc.city_id = c.id WHERE uc.user_id = $1 ORDER BY c.name', [userId]);
    if (!cities || cities.length === 0) {
      const all = await req.app.connection.query('SELECT id as city_id, name as city FROM cities ORDER BY name');
      cities = all[0] || [];
    }

    return res.render('private/list', {
      activePage: 'visitas',
      records,
      recordsPending,
      cities: cities || [],
      username: req.session.username,
      role: req.session.role
    });
  } catch (err) {
    console.error('Erro ao renderizar lista de visitas:', err && err.stack ? err.stack : err);
    return res.status(500).render('error', { layout: false, type: 'danger', message: 'Erro ao carregar lançamentos.' });
  }
}

async function appChartsVisits(req, res) {
  try {
    console.log('appChartsVisits called; session=', {
      isLoggedIn: req.session && req.session.isLoggedIn,
      userId: req.session && req.session.userId,
      username: req.session && req.session.username,
      role: req.session && req.session.role,
      returnTo: req.session && req.session.returnTo
    });
    console.log('res.locals at charts start:', {
      isAuthenticated: res.locals.isAuthenticated,
      userId: res.locals.userId,
      cities: Array.isArray(res.locals.cities) ? res.locals.cities.length : res.locals.cities
    });
    // Preparar valores padrão para a view (evita ReferenceError quando variáveis não existem)
    const monthParam = req.query.month ? parseInt(req.query.month, 10) : (new Date().getMonth() + 1);
    const monthNames = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
    const month = monthParam ? (monthNames[(monthParam - 1 + 12) % 12] || '') : '';

    let housesOfPrayerStats = [];
    let barChartLabels = [];
    let barChartValues = [];
    let barChartTitle = '';
    let barChartXAxisLabel = 'Municípios';

    if (typeof visitService.getHousesOfPrayerStats === 'function') {
      try {
        // getHousesOfPrayerStats signature: (app, userId, month)
        housesOfPrayerStats = await visitService.getHousesOfPrayerStats(req.app, req.session.userId, monthParam) || [];
      } catch (e) {
        housesOfPrayerStats = [];
      }
    }

    if (typeof visitService.getChartData === 'function') {
      try {
        const chart = await visitService.getChartData(req.app, req.session.userId, null, monthParam) || {};
        barChartLabels = chart.labels || [];
        barChartValues = chart.values || [];
        barChartTitle = chart.title || '';
        barChartXAxisLabel = chart.xAxisLabel || (barChartLabels.length ? 'Municípios' : 'Casas de Oração');
      } catch (e) {
        barChartLabels = [];
        barChartValues = [];
      }
    }

    return res.render('private/charts', {
      activePage: 'graficos',
      username: req.session.username,
      role: req.session.role,
      cities: req.session.cities || [],
      month,
      message: '',
      housesOfPrayerStats,
      barChartLabels,
      barChartValues,
      barChartTitle,
      barChartXAxisLabel,
      churches: []
    });
  } catch (err) {
    console.error('Erro ao renderizar charts:', err);
    return res.status(500).render('error', { layout: false, type: 'danger', message: 'Erro ao carregar gráficos.' });
  }
}

async function appReportsVisits(req, res) {
  try {
    const type = req.query.type || '';
    const monthParam = req.query.month ? parseInt(req.query.month, 10) : null;
    const monthNames = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
    const month = monthParam ? (monthNames[(monthParam - 1 + 12) % 12] || '') : '';

    let recordsGeneral = [];
    if (typeof visitService.getReport === 'function') {
      try {
        recordsGeneral = await visitService.getReport(req.app, req.session.userId, { type, month: monthParam }) || [];
      } catch (e) {
        recordsGeneral = [];
      }
    }

    const typeMap = { general: 'Geral', city: 'Por Município', no_service: 'Últimos 3 meses sem atendimento' };
    const typeName = typeMap[type] || (type ? type : 'Geral');

    const regional = req.app.regional || { name: '' };

    return res.render('private/reports', {
      activePage: 'relatorios',
      username: req.session.username,
      role: req.session.role,
      cities: req.session.cities || [],
      type,
      month,
      recordsGeneral,
      typeName,
      regional,
      error: null
    });
  } catch (err) {
    console.error('Erro ao renderizar reports:', err);
    return res.status(500).render('error', { layout: false, type: 'danger', message: 'Erro ao carregar relatórios.' });
  }
}

module.exports = {
  appVisitsIndex,
  registerVisitController,
  getVisit,
  updateVisit,
  deleteVisit,
  appChartsVisits,
  appReportsVisits,
  listVisitsPage
};
