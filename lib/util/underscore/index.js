/**
 * This is place-holder module to allow for extension of underscore with custom
 * operators and such.
 * @module util.underscore
 */
// Require the extension here. Each extension should modify the core underscore
// module, and, optionally return it.
require('./objectDiff');
require('./differences');

module.exports = require('underscore');
