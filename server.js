const express = require('express');
const bodyParser = require('body-parser');
const routes = require('./api/routes');
require('dotenv').config();

const app = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use('/', routes);

app.listen(process.env.PORT, () => {
  console.log('App listening on port ', process.env.PORT);
});

module.exports = app;
