const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const shortid = require("shortid");
const dns = require("dns");
const urlParser = require("url");
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const app = express();

// Basic Configuration
const port = process.env.PORT || 3000;

mongoose.connect(process.env.MONGO_URI, { useUnifiedTopology: true, useNewUrlParser: true });

const urlSchema = new mongoose.Schema({
  original_url: {
    type: String,
    require: true,
  },
  short_url: {
    type: String,
    require: true,
    default: shortid.generate,
  },
});

const Url = mongoose.model("Url", urlSchema);

app.use(cors());

app.use("/public", express.static(`${process.cwd()}/public`));

app.use(bodyParser.urlencoded({ extended: false }));

app.get("/", function (req, res) {
  res.sendFile(process.cwd() + "/views/index.html");
});

// Your first API endpoint
app.post("/api/shorturl", async (req, res) => {
  const url = await Url.create({ original_url: req.body.url });
  const oriUrl = url.original_url;
  const shortUrl = url.short_url;
  const parseUrl = urlParser.parse(oriUrl).hostname;
  dns.lookup(parseUrl, (err, address, family) => {
    if (!address) {
      res.json({ error: "invalid url" });
    } else {
      res.json({ original_url: oriUrl, short_url: shortUrl });
    }
  });
});

app.get("/api/shorturl/:shorturl", async (req, res) => {
  const shortUrl = req.params.shorturl;
  const url = await Url.findOne({ short_url: shortUrl });
  try {
    res.redirect(url.original_url);
  } catch (error) {
    res.json({ error: "invalid url" });
  }
});

app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});
