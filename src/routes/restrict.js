// src/routes/restrict.js
// Rotas protegidas + validações para evitar "Route.get() ... Undefined"

const express = require("express");
const rateLimit = require("express-rate-limit");

const router = express.Router();

const login = require("../controllers/login");
const visits = require("../controllers/visits");
const users = require("../controllers/users");
const isAdmin = require("../utils/adminMiddleware");

/**
 * Garante que cada handler passado para o Express é realmente uma função.
 * Se algum controller não exportar a função, você descobre de forma clara
 * (e não com o erro genérico do Express).
 */
function mustBeFn(fn, name) {
  if (typeof fn !== "function") {
    throw new TypeError(
      `[ROUTES] Handler inválido: "${name}" não é função. ` +
        `Verifique exports/imports do controller. Recebido: ${typeof fn}`
    );
  }
  return fn;
}

/**
 * Rate limit para login
 */
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5,
  keyGenerator: (req) => (req.body && req.body.email ? req.body.email : req.ip),
  handler: (req, res) => {
    res.status(429);
    return res.render("error", {
      layout: false,
      type: "danger",
      message: "Muitas tentativas de login. Tente novamente mais tarde.",
    });
  },
});

/**
 * Acesso
 */
router.get("/acesso", mustBeFn(login.appLogin, "login.appLogin"));
router.post(
  "/acesso",
  loginLimiter,
  mustBeFn(login.authenticateUser, "login.authenticateUser")
);

/**
 * Visitas
 */
router.get("/visitas/:id", mustBeFn(visits.getVisit, "visits.getVisit"));
router.put("/visitas/:id", mustBeFn(visits.updateVisit, "visits.updateVisit"));
router.delete(
  "/visitas/:id",
  mustBeFn(visits.deleteVisit, "visits.deleteVisit")
);

router.get("/graficos", mustBeFn(visits.appChartsVisits, "visits.appChartsVisits"));
router.post("/graficos", mustBeFn(visits.appChartsVisits, "visits.appChartsVisits"));

router.get("/relatorios", mustBeFn(visits.appReportsVisits, "visits.appReportsVisits"));

/**
 * Usuário
 */
router.get("/usuario", mustBeFn(users.appUserInfo, "users.appUserInfo"));
router.post("/alterar-senha", mustBeFn(users.changePassword, "users.changePassword"));

/**
 * Admin
 */
router.get(
  "/admin/users",
  mustBeFn(isAdmin, "isAdmin"),
  mustBeFn(users.listUsers, "users.listUsers")
);

router.get(
  "/admin/users/create",
  mustBeFn(isAdmin, "isAdmin"),
  mustBeFn(users.createUserForm, "users.createUserForm")
);

router.post(
  "/admin/users/create",
  mustBeFn(isAdmin, "isAdmin"),
  mustBeFn(users.createUser, "users.createUser")
);

module.exports = router;
