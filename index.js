const fs = require('fs');
const path = require('path');
const express = require('express');
const chokidar = require('chokidar');
const dumpsterFire = require('dumpster-fire');
const findNodeModules = require('find-node-modules');

module.exports = function dumpsterFireServer(configs, preferredPort) {
  const port = preferredPort ? preferredPort : 8080;
  const app = express();

  // Setup build middlewares.
  configs.forEach(config => {
    const compiler = dumpsterFire(config);
    const mountPoint = config.publicPath ? config.publicPath : '/';

    chokidar.watch([config.context]).on('all', () => {
      compiler.ready = false;
      compiler.build();
    });
    app.use(mountPoint, (req, res, next) => {
      if (compiler.ready) {
        next();
      } else {
        compiler.build().then(() => next());
      }
    });
  });

  // hook up express.static middlewares based on configs.
  configs.forEach(config => {
    const mountPoint = config.publicPath ? config.publicPath : '/';
    app.use(mountPoint, express.static(config.outputDirectory));
  });

  app.listen(port, () => {
    console.log(`Listening on port ${port}`);
  });
}
