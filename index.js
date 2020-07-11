const { spawn } = require('child_process');
const Gpio = require('pigpio').Gpio;
const log4js = require("log4js");

log4js.configure({
  appenders: { startecho: { type: "file", filename: "startecho.log" } },
  categories: { default: { appenders: ["startecho"], level: "debug" } }
});

const logger = log4js.getLogger("startecho");

const g = spawn('/bin/bash', ['startsample.sh'])

g.stdout.on('data', (data) => {
  logger.debug(data.toString());
  console.log(data.toString());
});

let isMuted = true;

setTimeout(() => {
  // mute after start
  g.stdin.write('m\n');
}, 5000);

function debounce(func, wait, immediate) {
  let timeout;
  return function() {
    let context = this, args = arguments;
    let later = function() {
        timeout = null;
        if (!immediate) func.apply(context, args);
    };
    let callNow = immediate && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    if (callNow) func.apply(context, args);
  };
};

const button = new Gpio(17, {
  mode: Gpio.INPUT,
  pullUpDown: Gpio.PUD_UP,
  edge: Gpio.EITHER_EDGE
});

button.glitchFilter(10000);

const handleChange = debounce(() => {
  if (isMuted === true) {
    console.log('unmute');
    isMuted = false;
    g.stdin.write('m\n');
    setTimeout(() => {g.stdin.write('t\n')}, 500);
  } else {
    console.log('mute');
    isMuted = true;
    g.stdin.write('s\n');
    setTimeout(() => {g.stdin.write('m\n')}, 500);
  }
}, 500);

button.on('interrupt', handleChange);
