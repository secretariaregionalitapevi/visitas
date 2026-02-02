const express = require("express");
const router = express.Router();

function mustBeFn(fn, name) {
  if (typeof fn !== "function") {
    throw new TypeError(`[ROUTES] "${name}" está undefined ou não é função.`);
  }
  return fn;
}

// IMPORTS (ajuste de acordo com o seu arquivo)
const visits = require("../controllers/visits");

// EXEMPLO: rota inicial
router.get("/", mustBeFn(visits.appVisitsIndex, "visits.appVisitsIndex"));

module.exports = router;
