const Homey  = require('homey');
const rfSignal = new Homey.Signal433('RFSwitch');
let signal;
let settings = {};

module.exports = class RFSiwtch extends Homey.Device {
  async onInit() {
    this.signal = await rfSignal.register();
    this.registerCapabilityListener('button', sendSignal.bind(this));
  }
}

function sendSignal() {
  const settings = this.getSettings();
  this.signal.tx(settings.signal);
};
