/**
 * @format
 */

if (!Array.prototype.findLastIndex) {
  Object.defineProperty(Array.prototype, 'findLastIndex', {
    value: function (predicate, thisArg) {
      for (let i = this.length - 1; i >= 0; i--) {
        if (predicate.call(thisArg, this[i], i, this)) return i;
      }
      return -1;
    },
    writable: true,
    configurable: true,
  });
}

globalThis.RNFB_SILENCE_MODULAR_DEPRECATION_WARNINGS = true;

import {AppRegistry, LogBox} from 'react-native';
import App from './App';
import {name as appName} from './app.json';

// 🚫 Suppress all React Native warnings (yellow boxes)
LogBox.ignoreAllLogs(true);

// 🚫 Prevent red screen crash errors from showing in UI
const originalConsoleError = console.error;
console.error = (...args) => {
  if (
    typeof args[0] === 'string' &&
    args[0].includes('[firestore/permission-denied]')
  ) {
    // ignore only Firestore permission errors
    return;
  }
  originalConsoleError(...args); // still log others in terminal
};

AppRegistry.registerComponent(appName, () => App);
