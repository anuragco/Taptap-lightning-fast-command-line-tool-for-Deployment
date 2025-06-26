const express = require('express');
const open = require('open');
const path = require('path');

module.exports = async function previewSite() {
  const app = express();
  const PORT = 5000;

  app.use(express.static(process.cwd()));

  app.listen(PORT, () => {
    console.log(`🔍 Preview on: http://localhost:${PORT}`);
    open(`http://localhost:${PORT}`);
  });
};


