const URL_PREFIX = "/gtin-wizard";
const gtinWizardStorage = "gtin-wizard-storage";

function GtinWizard(server) {
    const path = require('path');
    const fs = require('fs');
    const VirtualMQ = require('psk-apihub');
    const httpWrapper = VirtualMQ.getHttpWrapper();
    const httpUtils = httpWrapper.httpUtils;
    const crypto = require('pskcrypto');
    const serverCommands = require('./utils/serverCommands');
    const executioner = require('./utils/executioner');
    const randSize = 32;

    function setHeaders(req, res, next) {
        res.setHeader('Access-Control-Allow-Origin', '*');

        // Request methods you wish to allow
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

        // Request headers you wish to allow
        res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type, Content-Length, X-Content-Length');
        next();
    }

    function beginSession(req, res) {
        const transactionId = crypto.randomBytes(randSize).toString('hex');
        fs.mkdir(path.join(server.rootFolder, gtinWizardStorage, transactionId), {recursive: true}, (err) => {
            if (err) {
                res.statusCode = 500;
                res.end();
                return;
            }

            res.end(transactionId);
        });
    }

    function sendError(req, res) {
        res.statusCode = 400;
        res.end('Illegal url, missing transaction id');
    }

    function addFileToDossier(req, res) {
        const transactionId = req.params.transactionId;
        const fileObj = {
            dossierPath: req.headers["x-dossier-path"],
            stream: req
        };

        serverCommands.addFile(path.join(server.rootFolder, gtinWizardStorage, transactionId), fileObj, (err) => {
            if (err) {
                if (err.code === 'EEXIST') {
                    res.statusCode = 409;
                } else {
                    res.statusCode = 500;
                }
            }

            res.end();
        });
    }
    function setDLDomain(req, res) {
        const transactionId = req.params.transactionId;
        serverCommands.setDLDomain(path.join(server.rootFolder, gtinWizardStorage, transactionId), req.body, (err) => {
            if (err) {
                res.statusCode = 500;
            }

            res.end();
        });
    }

    function mount(req, res) {
        const transactionId = req.params.transactionId;
        const mountPoint = {
            path: req.headers['x-mount-path'],
            seed: req.headers['x-mounted-dossier-seed']
        };

        serverCommands.mount(path.join(server.rootFolder, gtinWizardStorage, transactionId), mountPoint, (err) => {
            if (err) {
                res.statusCode = 500;
                console.log("Error", err);
                res.end();
                return;
            }
            res.end();
        });
    }

    function buildDossier(req, res) {
        const transactionId = req.params.transactionId;
        executioner.executioner(path.join(server.rootFolder, gtinWizardStorage, transactionId), (err, seed) => {
            if (err) {
                console.log(err);
                res.statusCode = 500;
                res.end();
                return;
            }

            res.end(seed.toString());

        });
    }

    function createGTIN_SSI(req, res){
        const gtinData = JSON.parse(req.body);
        const GtinResolver = require("../gtin-resolver");
        const gtinSSI = GtinResolver.createGTIN_SSI(gtinData.dlDomain, gtinData.gtin, gtinData.batch, gtinData.expiration);
        const transactionId = req.params.transactionId;
        serverCommands.setKeySSI(path.join(server.rootFolder, gtinWizardStorage, transactionId), gtinSSI.getIdentifier(), (err) => {
            if (err) {
                console.log(err);
                res.statusCode = 500;
            }

            res.end();
        });
    }

    function redirect(req, res) {
        res.statusCode = 303;
        let redirectLocation = 'index.html';

        if (!req.url.endsWith('/')) {
            redirectLocation = `${URL_PREFIX}/` + redirectLocation;
        }

        res.setHeader("Location", redirectLocation);
        res.end();
    }

    server.use(`${URL_PREFIX}/*`, setHeaders);

    server.post(`${URL_PREFIX}/begin`, beginSession);

    server.post(`${URL_PREFIX}/addFile`, sendError);
    server.post(`${URL_PREFIX}/addFile/:transactionId`, addFileToDossier);

    server.post(`${URL_PREFIX}/setDLDomain`, sendError);
    server.post(`${URL_PREFIX}/setDLDomain/:transactionId`, httpUtils.bodyParser);
    server.post(`${URL_PREFIX}/setDLDomain/:transactionId`, setDLDomain);

    server.post(`${URL_PREFIX}/gtin`, sendError);
    server.post(`${URL_PREFIX}/gtin/:transactionId`, httpUtils.bodyParser);
    server.post(`${URL_PREFIX}/gtin/:transactionId`, createGTIN_SSI);

    server.post(`${URL_PREFIX}/mount`, sendError);
    server.post(`${URL_PREFIX}/mount/:transactionId`, mount);

    server.post(`${URL_PREFIX}/build`, sendError);
    server.post(`${URL_PREFIX}/build/:transactionId`, httpUtils.bodyParser);
    server.post(`${URL_PREFIX}/build/:transactionId`, buildDossier);

    server.use(`${URL_PREFIX}`, redirect);

    server.use(`${URL_PREFIX}/*`, httpUtils.serveStaticFile(path.join(process.env.PSK_ROOT_INSTALATION_FOLDER, 'modules/dsu-wizard/web'), `${URL_PREFIX}/`));
}

module.exports = GtinWizard;
