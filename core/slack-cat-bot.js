'use strict';

const SlackBot = require('slackbots');
const extend = require('extend');

const MSG_TIMEOUT = 250;

/**
 *
 * The timeouts are for a scroll issue. When the bot responds in real time
 * there is strange behavior where slack won't scroll to the newest msg.
 *
 **/
module.exports = class SlackCatBot extends SlackBot {
  constructor(args) {
    super(args);

    const name = config.getKey('bot_name');
    const icon_emoji = config.getKey('bot_emoji');
    const icon_url = config.getKey('bot_icon_url');

    this.botParams = {
      username: name || 'SlackCat',
    };

    if (icon_url) {
      // url takes prority.
      this.botParams['icon_url'] = icon_url;
    } else {
      this.botParams['icon_emoji'] = icon_emoji || ':cat:';
    }
  }
  
  async postMessage(channelId, msg) {
    // Set default bot params.
    await this.delayForScrollIssue();
    super.postMessage(channelId, msg, this.botParams);
  }

  async postMessageWithParams(channelId, msg, params) {
    await this.delayForScrollIssue();
    super.postMessage(channelId, msg, params);
  }

  postMessageSequentially(data, messages) {
    const promiseSerial = funcs =>
      funcs.reduce(
        (promise, func) =>
          promise.then(result =>
            func().then(Array.prototype.concat.bind(result))
          ),
        Promise.resolve([])
      );

    // convert each url to a function that returns a promise
    const funcs = messages.map(msg => () =>
      this.postMessage(data.channel, msg)
    );

    // execute Promises in serial
    promiseSerial(funcs).catch(console.error.bind(console));
  }

  postFancyMessage(channel_id, icon_emoji, color, title, body, botParams) {
    setTimeout(() => {
      var attachments = {
        icon_emoji: icon_emoji,
        attachments: [
          {
            color: color,
            title: title,
            text: body,
          },
        ],
      };

      var params = extend(
        {
          channel: channel_id,
          username: this.name,
        },
        botParams || {},
        attachments
      );

      this.postRawMessage(channel_id, params);
    }, MSG_TIMEOUT);
  }

  postMessageToThread(id, text, ts, params) {
    params = extend(
      {
        text: text,
        channel: id,
        thread_ts: ts,
        username: this.name,
      },
      params || this.botParams
    );
    return this._api('chat.postMessage', params);
  }

  postRawMessage(channel_id, args) {
    var params = extend(
      {
        channel: channel_id,
        username: this.name,
      },
      args || {}
    );

    return this._api('chat.postMessage', params);
  }

  getUserNameFromId(user_id) {
    return this._api('users.info', {
      user: user_id,
    });
  }

  async resolveUserNameFromId(user_id) {
    const randUserData = await this.userDataPromise(user_id);
    return randUserData.user.profile.display_name
      ? randUserData.user.profile.display_name
      : randUserData.user.profile.real_name;
  }

  userDataPromise(user_id) {
    return this._api('users.info', {
      user: user_id,
    })
      .then(data => {
        return data;
      })
      .catch(err => {
        return err;
      });
  }

  delayForScrollIssue() {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        resolve();
      }, MSG_TIMEOUT);
    });
  }
};
