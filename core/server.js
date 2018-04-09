'use strict';
require('dotenv').config();
const axios = require('axios');
const express = require('express');
const bodyParser = require('body-parser');
const qs = require('querystring');

const app = express();

module.exports = class Server {
  constructor() {
    /*
     * Parse application/x-www-form-urlencoded && application/json
     */
    app.use(
      bodyParser.urlencoded({
        extended: true,
      })
    );
    app.use(bodyParser.json());

    this.app = app;
  }

  initHandleCallback(callback) {
    /*
     * Endpoint to receive the dialog submission. Checks the verification token
     * and creates a Helpdesk ticket
     */
    this.app.post('/interactive-component', (req, res) => {
      const body = JSON.parse(req.body.payload);
      // check that the verification token matches expected value
      if (body.token === process.env.SLACK_VERIFICATION_TOKEN) {
        // immediately respond with a empty 200 response to let
        // Slack know the command was received
        res.send('');

        callback(body);
      } else {
        console.error("Sent 500", "Check that the verification token matches expected value");
        res.sendStatus(500);
      }
    });
  }

  start() {
    this.app.listen(process.env.PORT, () => {
      console.log(`App listening on port ${process.env.PORT}!`);
    });
  }
};
