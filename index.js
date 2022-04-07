const express = require('express');
const axios = require('axios');
const nunjucks = require('nunjucks');

const banano = require('./banano.js');
const database = require('./database.js');
const config = require('./config.js');

const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');

nunjucks.configure('templates', { autoescape: true });

const app = express();

app.use(express.static('files'));

//middleware
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use(cookieParser());

const claim_freq = config.claim_freq;
const faucet_address = config.address;

app.get('/', async function(req, res) {
  if (config.allowed_site != "*") {
    res.set("Content-Security-Policy", "frame-ancestors 'self' "+config.allowed_site);
  }
  return res.send(nunjucks.render('index.html', {
    faucet_address: faucet_address
  }));
});

app.post('/', async function(req, res) {
  return res.send(nunjucks.render('index.html', {}));
});

app.listen(8081, async () => {
  //recieve banano deposits
  await banano.receive_deposits();
  console.log('App running!');
});