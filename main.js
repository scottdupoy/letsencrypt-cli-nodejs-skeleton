// dependencies
var express = require('express');
var http = require('http');
var https = require('https');
var path = require('path');
var fs = require('fs');

// preamble
var domain = 'myexample.com';
var email = 'admin@myexample.com';
var letsencryptChallengeRoot = 'C:/letsencrypt/challenge';
var letsencryptCertificateRoot = 'C:/letsencrypt/certificates';

var letsencryptChallengePath = letsencryptChallengeRoot + '/.well-known/acme-challenge';
var letsencryptCertificatePath = letsencryptCertificateRoot + '/live/' + domain;
var keyPath = path.join(letsencryptCertificatePath, 'privkey.pem');
var certPath = path.join(letsencryptCertificatePath, 'fullchain.pem');
var caPath = path.join(letsencryptCertificatePath, 'chain.pem');

console.log();
console.log('use the following to generate certificates:');
console.log();
console.log('    setup:');
console.log();
console.log('        npm install -g letsencrypt-cli --msvs_version=2015');
console.log('            (prepare yourself for an epic battle of patience involving python, vs build tool chain and openssl...');
console.log();
console.log('    dev:');
console.log();
console.log('        letsencrypt certonly \\');
console.log('            --agree-tos \\');
console.log('            --email ' + email + ' \\');
console.log('            --webroot \\');
console.log('            --webroot-path ' + letsencryptChallengeRoot + ' \\');
console.log('            --config-dir ' + letsencryptCertificateRoot + ' \\');
console.log('            --domains ' + domain + ' \\');
console.log('            --server https://acme-staging.api.letsencrypt.org/directory');
console.log();
console.log('  production:');
console.log();
console.log('        letsencrypt certonly \\');
console.log('            --agree-tos \\');
console.log('            --email ' + email + ' \\');
console.log('            --webroot \\');
console.log('            --webroot-path ' + letsencryptChallengeRoot + ' \\');
console.log('            --config-dir ' + letsencryptCertificateRoot + ' \\');
console.log('            --domains ' + domain + ' \\');
console.log('            --server https://acme-v01.api.letsencrypt.org/directory');
console.log();

// do the certificate files exist?
var certificatesExist = fs.existsSync(keyPath) && fs.existsSync(certPath) && fs.existsSync(caPath);
console.log('certificatesExist: ' + certificatesExist);

// set up an http server which allows us to either map letsencrypt challenges
// to C:\letsencrypt\challenge\xyz or redirect to the https url if the certificates 
// are ready (they won't be the first time this is run)
var httpApp = express();
httpApp.use(function(req, res, next) {
    // custom middleware to log incoming requests
    console.log('request received for: ' + req.url);
    next();
});
httpApp.use('/.well-known/acme-challenge', express.static(letsencryptChallengePath));
httpApp.get('*', function(req, res){
    if (certificatesExist) {
        // redirect to https server
        redirectUrl = 'https://' + req.hostname + req.url;
        console.log('redirecting http url to https: ' + redirectUrl);
        res.redirect(redirectUrl)
    }
    else {
        // not https server so issue trivial response but no redirect
        res.end('non acme-challenge http request received but https server not running so not redirecting');
    }
});
http.createServer(httpApp).listen(80, '0.0.0.0', function() {
    console.log('http server started on 0.0.0.0:80');
});

// if the certificates exist then we also set up the https server
if (certificatesExist) {
    var httpsApp = express();
    var credentials = {
        key: fs.readFileSync(keyPath, 'utf8'),
       cert: fs.readFileSync(certPath, 'utf8'),
        ca: fs.readFileSync(caPath, 'utf8'),
    };
    httpsApp.get('*', function(req, res) {
        console.log('received https request');
        res.end('hello via https! :)');
    });
    https.createServer(credentials, httpsApp).listen(443, '0.0.0.0', function() {
        console.log('https server started on 0.0.0.0:443');
    });
}
