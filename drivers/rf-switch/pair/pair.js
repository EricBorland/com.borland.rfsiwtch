let settings = {}

function recordRemoteSignal() {
  Homey.showLoadingOverlay();
  Homey.emit('record', true, err => {
    Homey.hideLoadingOverlay();
    if (err) {
      Homey.alert(__(err) || err);
    }
  });
}

function getSettings(callback) {
  Homey.showLoadingOverlay();
  Homey.emit('getSettings', true, (err, settingsObj) => {
    settings = settingsObj;
    Homey.hideLoadingOverlay();
    if (callback) {
      return callback(null, settings);
    }
  });
}

function setRecordedSignal(err) {
  document.getElementById('recorded-signal').innerText = settings.signalDefinition.base;
}

function initSignalDefinition() {
  Homey.showLoadingOverlay();
  getSettings(() => {
    addChannelWords(settings.signalDefinition);
    const wordBase = settings.signalDefinition.base;
    document.getElementById('base').value = wordBase;
    if (!settings.signalDefinition.custom) {
      document.getElementById('base').setAttribute('disabled', 'disabled');
    }
    Homey.hideLoadingOverlay();
  });
}

function addChannelWords(signal) {
  let fragment = document.createDocumentFragment();
  signal.channels.forEach((channel, i) => {
    // Creating container to append
    let container = document.createElement('div');
    container.className = 'row';

    // H2 title
    let h2 = document.createElement('h2');
    h2.setAttribute('data-i18n', 'PAIR.SIGNAL_DEFINITION.CHANNEL_' + (i + 1));
    container.appendChild(h2);

    // Channel word input
    let input = document.createElement('input');
    input.value = channel;
    input.id = 'channel-' + i;
    input.className = 'col-4';
    if (!signal.custom) {
      input.setAttribute('disabled', 'disabled');
    }
    container.appendChild(input);

    // Span separation
    let span = document.createElement('span');
    span.className = 'col-1';
    container.appendChild(span);

    // Test button
    let button = document.createElement('button');
    button.onclick = emit.bind(this, i);
    button.className = 'col-5 btn-action';
    button.textContent = 'Test';
    container.appendChild(button);

    // Appending container to document fragment
    fragment.appendChild(container);
  });
  document.getElementById('words-container').appendChild(fragment);
}

function refresh() {
  Homey.emit('refreshWordBase', true, (err, base) => {
    document.getElementById('base').value = base;
  });
}

function getChannelWord(channelNumber = 0) {
  const base = document.getElementById('base').value;
  const word = base.substring(0, base.length - 4) + document.getElementById('channel-' + channelNumber).value;
  return Array.from(word).map(bit => parseInt(bit));
}

function emit(channel) {
  Homey.emit('sendData', getChannelWord(channel));
}

function createDevice(device) {
  return new Promise((resolve, reject) => Homey.createDevice(device, (err, result) => {
    if (err) reject(err);
    resolve(result);
  }));
}

async function pair() {
  Homey.showLoadingOverlay();
  const devices = [];
  for (let i = 0; i < settings.numberOfChannels; ++i) {
    devices.push(createDevice({
      name: 'RF Switch',
      class: 'button',
      data: {
        id: new Date().getTime()
      },
      settings: {
        signal: getChannelWord(i)
      },
      capabilities: ['button']
    }));
  }
  await Promise.all(devices);
  Homey.done();
}
