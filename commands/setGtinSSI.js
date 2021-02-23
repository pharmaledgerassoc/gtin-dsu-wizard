function setGtinSSI(server){
	const dsu_wizard = require("dsu-wizard");
	const commandRegistry = dsu_wizard.getCommandRegistry(server);
	const utils = dsu_wizard.utils;

	commandRegistry.register("/gtin", "post", (req, callback)=>{
		const transactionManager = dsu_wizard.getTransactionManager();

		utils.bodyParser(req, (err)=>{
			if(err){
				return callback(err);
			}
			const GtinResolver = require("../../gtin-resolver");

			const gtinData = JSON.parse(req.body);
			const {dlDomain, bricksDomain, gtin, batch} = gtinData
			const gtinSSI = GtinResolver.createGTIN_SSI(dlDomain, bricksDomain ? bricksDomain : dlDomain, gtin, batch);

			const transaction = transactionManager.getTransaction(req.params.transactionId, (err, transaction)=>{
				transaction.context.keySSI = gtinSSI.getIdentifier();
				transaction.context.forceNewDSU = true;
				transaction.context.options.useSSIAsIdentifier = true;
				transactionManager.persistTransaction(transaction, (err)=>{
					if(err){
						return callback(err);
					}
					const command = require("dsu-wizard").getDummyCommand().create("setGtinSSI");

					return callback(undefined, command);
				});
			});
		});
	});
}

module.exports = setGtinSSI;
