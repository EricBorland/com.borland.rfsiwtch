'use strict';

const Homey = require('homey');

class RFSwitch extends Homey.App {

  onInit() {
    this.log('RF Switch is running...');
  }

}

module.exports = RFSwitch;