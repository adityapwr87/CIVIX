const selfsigned = require("selfsigned");
const fs = require("fs");

const attrs = [{ name: "commonName", value: "localhost" }];
const pems = selfsigned.generate(attrs, { days: 365 });

fs.writeFileSync("certs/privkey.pem", pems.private);
fs.writeFileSync("certs/cert.pem", pems.cert);

console.log("Self-signed certificate generated!");
