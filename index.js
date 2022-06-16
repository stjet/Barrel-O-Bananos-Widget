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

let ip_cache = {};

app.get('/', async function(req, res) {
  //To restrict unauthorized iframing https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy
  if (config.allowed_site != "*") {
    res.set("Content-Security-Policy", "frame-ancestors 'self' "+config.allowed_site);
  }
  return res.send(nunjucks.render('index.html', {
    faucet_address: faucet_address,
    sitekey: config.hcaptcha_sitekey,
    errors: false,
    claimed: false
  }));
});

app.post('/', async function(req, res) {
  let address = req.body.address;
  if (!(await banano.is_valid(address))) {
    return res.send(nunjucks.render('index.html', {
      faucet_address: faucet_address,
      sitekey: config.hcaptcha_sitekey,
      errors: "Invalid Banano Address",
      claimed: true
    }));
  }
  //ip check
  let ip = req.header('x-forwarded-for');
  if (ip_cache[ip] > 4) {
    return res.send(nunjucks.render('index.html', {
      faucet_address: faucet_address,
      sitekey: config.hcaptcha_sitekey,
      errors: "Too many claims from this IP",
      claimed: true
    }));
  }
  if (ip_cache[ip]) {
    ip_cache[ip] = ip_cache[ip]+1;
  } else {
    ip_cache[ip] = 1;
  }
  //verify captcha
  let token = req.body['h-captcha-response'];
  let params = new URLSearchParams();
  params.append('response', token);
  params.append('secret', process.env.secret);
  let captcha_resp = await axios.post('https://hcaptcha.com/siteverify', params)
  captcha_resp = captcha_resp.data;
  if (!captcha_resp['success']) {
    return res.send(nunjucks.render('index.html', {
      faucet_address: faucet_address,
      sitekey: config.hcaptcha_sitekey,
      errors: "Captcha unsuccessful",
      claimed: true
    }));
  }
  //check faucet dryness
  if (await banano.faucet_dry()) {
    return res.send(nunjucks.render('index.html', {
      faucet_address: faucet_address,
      sitekey: config.hcaptcha_sitekey,
      errors: "Faucet dry",
      claimed: true
    }));
  }
  //check last claims - db
  let claim_freq = config.claim_freq;
  let db_resp = await database.find(address);
  if (db_resp) {
    if (Number(db_resp.last_claim)+claim_freq > Date.now()) {
      return res.send(nunjucks.render('index.html', {
        faucet_address: faucet_address,
        sitekey: config.hcaptcha_sitekey,
        errors: "Last claim too soon",
        claimed: true
      }));
    }
  }
  //check last claims - cookie
  if (req.cookies['last_claim']) {
    if (Number(req.cookies['last_claim'])+claim_freq > Date.now()) {
      return res.send(nunjucks.render('index.html', {
        faucet_address: faucet_address,
        sitekey: config.hcaptcha_sitekey,
        errors: "Last claim too soon",
        claimed: true
      }));
    }
  }
  //determine suspiciousness, out right reject if on blacklist
  let reduced = false;
  if (await banano.is_unopened(address)) {
    reduced = true;
  }
  // scoring system
  //send
  let payout;
  let faucet_balance = await banano.check_bal(config.address);
  if (reduced) {
    payout = 0.02;
  } else {
    //based on faucet balance
    if (faucet_balance > 1000) {
      payout = 0.42;
    } else if (faucet_balance > 500) {
      payout = 0.19;
    } else if (faucet_balance > 100) {
      payout = 0.069;
    } else {
      payout = 0.042;
    }
  }
  let success = await banano.send(address, payout);
  if (!success) {
    return res.send(nunjucks.render('index.html', {
      faucet_address: faucet_address,
      sitekey: config.hcaptcha_sitekey,
      errors: "Send failed try again later",
      claimed: true
    }));
  } else {
    //put in db, set cookie
    res.cookie('last_claim', String(Date.now()));
    await database.insert(address, String(Date.now()));
    return res.send(nunjucks.render('index.html', {
      faucet_address: faucet_address,
      sitekey: config.hcaptcha_sitekey,
      errors: false,
      claimed: true,
      payout: payout,
      to_address: address
    }));
  }
});

app.listen(8081, async () => {
  //recieve banano deposits
  await banano.receive_deposits();
  console.log('App running!');
});