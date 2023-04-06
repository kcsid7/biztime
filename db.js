/** Database setup for BizTime. */

const { Client } = require("pg");

const databaseURI = "postgresql:///biztime";

const client = new Client({
    connectionString: databaseURI
})

client.connect();

module.exports = client;

