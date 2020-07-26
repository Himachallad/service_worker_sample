const express = require("express");
const http = require("http");
const app = express();
const PORT = 5000;

app.use(express.static(__dirname + "/public"));

app.get("/", (req, res) => {
  res.sendFile("index.html");
});

http.createServer(app).listen(PORT, () => {
  console.log("HTTPS server running");
});
