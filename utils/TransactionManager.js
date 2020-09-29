const fs = require('fs');
const path = require('path');

function TransactionManager(localFolder) {

    const filePath = path.join(localFolder, 'commands.json');

    function loadTransaction(callback) {
        fs.mkdir(localFolder, {recursive: true}, (err) => {
            if (err) {
                return callback(err);
            }

            fs.readFile(filePath, (err, transaction) => {
                let transactionObj = {};
                if (err) {
                    return callback(undefined, transactionObj);
                }

                try {
                    transactionObj = JSON.parse(transaction.toString());
                } catch (e) {
                    return callback(e);
                }
                callback(undefined, transactionObj);
            });
        });
    }

    function saveTransaction(transaction, callback) {
        fs.mkdir(localFolder, {recursive: true}, (err) => {
            if (err) {
                return callback(err);
            }

            fs.writeFile(filePath, JSON.stringify(transaction), callback);
        });
    }

    function addCommand(command, callback) {

        loadTransaction((err, transaction) => {
            if (err) {
                return callback(err);
            }

            if (typeof transaction.commands === "undefined") {
                transaction.commands = [];
            }

            transaction.commands.push(command);

            saveTransaction(transaction, callback);
        });
    }

    return {
        addCommand,
        loadTransaction,
        saveTransaction
    };
}

module.exports = TransactionManager;
