function GTIN_DSU_WIZARD(server){
	//register new command
	const setGtinSSI = require("./commands/setGtinSSI");
	setGtinSSI(server);
}

module.exports = GTIN_DSU_WIZARD;