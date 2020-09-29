const fs = require("fs");
const path = require("path");

const TransactionManager = require("./TransactionManager");

function setKeySSI(workingDir, templateSSI, callback) {
    const manager = new TransactionManager(workingDir);
    manager.loadTransaction((err, transaction) => {
        if (err) {
            return callback(err);
        }
        transaction.templateSSI = templateSSI;
        manager.saveTransaction(transaction, callback);
    });
}

function addFile(workingDir, FileObj, callback) {
    const cmd = {
        name: 'addFile',
        params: {
            dossierPath: FileObj.dossierPath
        }
    };

    const manager = new TransactionManager(workingDir);
    const filePath = path.join(workingDir, path.basename(FileObj.dossierPath));
    fs.access(filePath, (err) => {
        if (!err) {
            const e = new Error('File already exists');
            e.code = 'EEXIST';
            return callback(e);
        }

        const file = fs.createWriteStream(filePath);

        file.on('close', () => {
            manager.addCommand(cmd, callback);
        });

        FileObj.stream.pipe(file);
    });
}

function setDLDomain(workingDir, dlDomain, callback) {
    const manager = new TransactionManager(workingDir);
    manager.loadTransaction((err, transaction) => {
        if (err) {
            return callback(err);
        }
        transaction.dlDomain = dlDomain;

        manager.saveTransaction(transaction, callback);
    });
}



function mount(workingDir, mountPoint, callback) {
    const cmd = {
        name: 'mount',
        params: {
            path: mountPoint.path,
            seed: mountPoint.seed
        }
    };

    const manager = new TransactionManager(workingDir);
    manager.addCommand(cmd, callback);
}
module.exports = {
    setKeySSI,
    addFile,
    setDLDomain,
    mount
};
