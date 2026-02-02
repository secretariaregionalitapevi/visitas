// api/index.js
const path = require("path");
const express = require("express");

const app = express();

// Ajuste o path das views para onde elas realmente estão no seu projeto
app.set("views", path.join(process.cwd(), "src", "views"));
app.set("view engine", "ejs");

// Arquivos estáticos
app.use("/css", express.static(path.join(process.cwd(), "public", "css")));
app.use("/js", express.static(path.join(process.cwd(), "public", "js")));
app.use("/images", express.static(path.join(process.cwd(), "public", "images")));

// Se você já tem rotas em src/routes, importe aqui
// const routes = require("../src/routes");
// app.use(routes);

app.get("/", (req, res) => {
  res.render("public/main"); // ajuste para o seu .ejs real
});

module.exports = app;
