const crypto = require('crypto');
const Homey = require('homey');
const rfSignal = new Homey.Signal433('RFSwitch');
const RECORDING_TIMEOUT = 10000; // 10 seconds

module.exports = class RFSwitch extends Homey.Driver {
  async onPair(socket) {
    this.settings = {
      numberOfChannels: null,
      signal: await rfSignal.register(),
      signalDefinition: {
        custom: false,
        base: [],
        channels: []
      }
    };
    this.socket = socket;

    // Payload listener
    this.settings.signal.on('payload', payloadReceived.bind(this));

    // Skip view listener
    socket.on('skip', skipView.bind(this));

    // Retrieve settings
    socket.on('getSettings', (data, callback) => callback(null, stringifySignal(this.settings)));

    // Set numnber of channels
    socket.on('setNumberOfChannels', setNumberOfChannels.bind(this));

    // Recor remote's signal
    socket.on('record', recordSignal.bind(this))

    // Signal definition
    socket.on('defineSignal', defineSignal.bind(this));
    socket.on('refreshWordBase', refreshWordBase.bind(this));
    socket.on('sendData', sendData.bind(this));
  }
}

function stringifySignal(settings) {
  const parsed = JSON.parse(JSON.stringify(settings));
  parsed.signalDefinition.base = parsed.signalDefinition.base.join('');
  parsed.signalDefinition.channels = parsed.signalDefinition.channels.map(channel => channel.join(''));
  return parsed;
}

async function payloadReceived(payload, first) {
  if (this.recordingCallback && first) {
    this.settings.signalDefinition = {
      custom: false,
      base: payload.slice(0, payload.length - 4).concat([0,0,0,0]),
      channels: getChannelsWords(this.settings.numberOfChannels)
    };
    this.recordingCallback();
    delete this.recordingCallback;
    this.socket.nextView();
  }
}

function skipView(destinationView) {
  if (destinationView.includes('signal-definition') && !this.settings.signalDefinition.base.length) {
    this.settings.signalDefinition = {
      custom: true,
      base: getRandomBase(),
      channels: getChannelsWords(this.settings.numberOfChannels)
    }
  } else if (destionationView.includes('done')) {
    return this.socket.done();
  }
  return this.socket.showView(destinationView);
}

async function setNumberOfChannels(data, callback) {
  this.settings.numberOfChannels = data;
  this.socket.nextView();
}

async function recordSignal(data, callback) {
  this.recordingCallback = callback;
  const timeout = setTimeout(() => {
    delete this.recordingCallback;
    return callback('TIMEOUT_ERROR_RECORDING')
  }, RECORDING_TIMEOUT);
}

function defineSignal() {
  this.settings.signalDefinition.custom = true;
  this.socket.showView('05-signal-definition');
}

function refreshWordBase(data, callback) {
  this.settings.word = getRandomBase();
  return callback(null, this.settings.word);
};

function sendData(data, callback) {
  this.settings.signal.tx(data, callback);
};

const getRandomBase = () => {
  const word = [];
  for (let i = 0; i < 24; ++i) {
    if (i < 19) {
      word.push(Math.round(Math.random()));
    } else {
      // last 4 bits are forced to 0 since
      // they are reserved for each channel
      word.push(0);
    }
  }
  return word;
};

const getChannelsWords = (numberOfChannels) => {
  const channels = [];
  for (let i = 0; i < numberOfChannels; ++i) {
    channels[i] = [0, 0, 0, 0];
    channels[i][channels[i].length - (i + 1)] = 1;
  }
  return channels;
}
