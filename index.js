const express = require('express');
const axios = require('axios');
const nunjucks = require('nunjucks');

const banano = require('./banano.js');
const database = require('./database.js');

const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');