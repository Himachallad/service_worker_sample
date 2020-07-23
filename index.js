const express = require("express");
const fs = require("fs");
const https = require("https");
const path = require("path");
const app = express();
const PORT = 5000;

const privateKey = fs.readFileSync("server.key");
const certificate = fs.readFileSync("server.cert");

app.use(express.static(__dirname + "/public"));

app.get("/", (req, res) => {
  res.sendFile("index.html");
});
var credentials = { key: privateKey, cert: certificate };

https.createServer(credentials, app).listen(PORT, () => {
  console.log("HTTPS server running");
});
