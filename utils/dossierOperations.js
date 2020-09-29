const openDSU = require("opendsu");

function createArchive(templateSSI, callback) {
    const keyssi = openDSU.loadApi("keyssi");

    if (typeof templateSSI === "function") {
        callback = templateSSI;
        templateSSI = keyssi.buildSeedSSI("default");
    }

    if (typeof templateSSI === "undefined" || templateSSI === '') {
        templateSSI = keyssi.buildSeedSSI("default");
    }

    const gtin_resolver = require("../../gtin-resolver");
    templateSSI = gtin_resolver.parseGTIN_SSI(templateSSI);
    openDSU.loadApi("resolver").createDSU(templateSSI, {useSSIAsIdentifier: true}, callback);
}

function addFile(workingDir, dossierPath, archive, callback) {
    const path = require("path");
    archive.addFile(path.join(workingDir, path.basename(dossierPath)), dossierPath, (err) => {

        if (err) {
            throw err;
        }

        callback(undefined);
    });
}

function mount(workingDir, path, seed, archive, callback) {
    archive.mount(path, seed, callback);
}

module.exports = {
    addFile,
    createArchive,
    mount
};