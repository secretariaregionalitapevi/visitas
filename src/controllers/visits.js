// src/controllers/visits.js

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

    return res.render("public/index", { cities, churches });
  } catch (err) {
    console.error("Erro ao carregar dados:", err);
    return res.render("public/index", { cities: [], churches: [] });
  }
}

async function getVisit(req, res) {
  return res.status(200).json({ ok: true, id: req.params.id });
}

async function updateVisit(req, res) {
  return res.status(200).json({ ok: true, id: req.params.id });
}

async function deleteVisit(req, res) {
  return res.status(200).json({ ok: true, id: req.params.id });
}

async function appChartsVisits(req, res) {
  return res.status(200).json({ ok: true });
}

async function appReportsVisits(req, res) {
  return res.status(200).json({ ok: true });
}

module.exports = {
  appVisitsIndex,
  getVisit,
  updateVisit,
  deleteVisit,
  appChartsVisits,
  appReportsVisits,
};
