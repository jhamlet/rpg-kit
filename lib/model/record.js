var protean = require('protean'),
    Rx = require('../util/rx'),
    _ = require('underscore');
/**
 * @class Record
 * @extends external:Rx.Observable
 * @mixes external:Rx.Observer
 */
function Record (values) {
    Record.superclass.call(this, this._subscribe.bind(this));

    this.properties = {};

    if (values) {
        this.set(values);
    }
}

module.exports = protean.inherit(Rx.Observable, Record, {
    /**
     * @param {String} key
     * @returns {Boolean}
     */
    has: function (key) {
        return this.properties.hasOwnProperty(key);
    },
    /**
     * Get an individual property, or get all properties as an object.
     * @param {String} [key]
     * @returns {external:Rx.Observable<Mixed|Object>}
     */
    get: function () {
        var arglen = arguments.length,
            key = arguments[0];

        if (arglen && this.has(key)) {
            return this.properties[key].take(1);
        }
        else if (!arglen) {
            return Rx.Observable.empty();
        }

        return this.values.take(1);
    },
    /**
     * @param {String} [key]
     * @param {Mixed} [value]
     * @param {Object<String,Mixed>} [values]
     * @returns {Record} the record instance
     */
    set: function () {
        var arglen = arguments.length,
            set, key, value, values, prop;

        if (arglen === 1) {
            values = arguments[0];
            set = this.set.bind(this);
            _.keys(values).
                forEach(function (key) { set(key, values[key]); });
        }
        else {
            key = arguments[0];
            value = arguments[1];
            prop = this.properties[key];
            if (!prop) {
                prop = this.createProperty(key, value);
            }
            else {
                prop.onNext(value);
            }
        }

        return this;
    },
    /**
     * @param {String} key
     * @param {Mixed} [value]
     * @returns {Record} the record instance
     */
    createProperty: function (key, value) {
        var prop = new Rx.BehaviorSubject(value);
        this.properties[key] = prop;
        return prop;
    },

    onNext: function (values) { this.set(values); },

    onError: function (error) {
    },

    onCompleted: function () {
    },

    _subscribe: function () {
        var v = this.values;
        return v.subscribe.apply(v, arguments);
    }
});

// console.log(new Record());
