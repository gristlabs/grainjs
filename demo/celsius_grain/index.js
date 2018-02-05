"use strict";

const { computed, observable, dom } = require('../..');

function toCelsius(fahrenheit) {
  return (fahrenheit - 32) * 5 / 9;
}

function toFahrenheit(celsius) {
  return (celsius * 9 / 5) + 32;
}

function tryConvert(temperature, convert) {
  const input = parseFloat(temperature);
  if (Number.isNaN(input)) {
    return '';
  }
  const output = convert(input);
  const rounded = Math.round(output * 1000) / 1000;
  return rounded.toString();
}


function BoilingVerdict(celsius) {
  return dom('p',
    dom.text(use => use(celsius) >= 100 ? 'The water would boil.' : 'The water would not boil.'));
}

function TemperatureInput(temperature, scaleName) {
  return dom('fieldset',
    dom('legend', `Enter temperature in ${scaleName}:`),
    dom('input', dom.prop('value', temperature),
      dom.on('input', e => temperature.set(e.target.value)))
  );
}

class Calculator extends dom.Component {
  constructor() {
    super();
    this._temp = observable('');
    this._scale = observable('c');

    const celsius = this.autoDispose(this._makeScaleTemp('c', toCelsius));
    const fahrenheit = this.autoDispose(this._makeScaleTemp('f', toFahrenheit));
    const celsiusValue = this.autoDispose(computed(use => parseFloat(use(celsius))));

    this.setContent(dom('div',
      TemperatureInput(celsius, 'Celsius'),
      TemperatureInput(fahrenheit, 'Fahrenheit'),
      BoilingVerdict(celsiusValue)
    ));
  }

  _makeScaleTemp(toScale, converter) {
    return computed(this._temp, this._scale,
      (use, temp, scale) => (scale === toScale ? temp : tryConvert(temp, converter)))
    .onWrite(val => { this._scale.set(toScale); this._temp.set(val); });
  }
}

dom.update(dom.find('#root'), dom.create(Calculator));
