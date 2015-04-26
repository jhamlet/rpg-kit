var protean = require('protean'),
    Property = require('./property'),
    Rx = require('../util/rx'),
    _ = require('../util/underscore'),
    merge = _.extend.bind(_),
    beget = function (o) { return merge({}, o); };
/**
 * @class Record
 * @extends external:Rx.Observable
 * @mixes external:Rx.Observer
 * @param {Object} [values]
 */
function Record (values) {
    var createProp = this.createProperty.bind(this),
        initialProps = this.initialProperties,
        initial,
        changes;

    Record.superclass.call(this, this._subscribe.bind(this));

    this.properties = {};

    this._updates = new Rx.Subject();
    this.updates = this._updates.asObservable();

    this._destroyed = new Rx.AsyncSubject();
    this.destroyed = this._destroyed.asObservable();

    changes = {};
    this.changes =
        this.
        updates.
        scan(changes, merge).
        throttle(0).
        select(beget).
        do(function () { changes = {}; }).
        publishValue(changes).
        refCount();

    initial = {};
    this.values =
        this.
        changes.
        scan(initial, merge).
        select(beget).
        publishValue(initial).
        refCount();

    if (initialProps) {
        _.keys(initialProps).
            forEach(function (key) {
                createProp.apply(null, initialProps[key]);
            });
    }

    if (values) { this.set(values); }
}
/**
 * Utility function to propagate property changes.
 * @param {String} name
 * @param {Mixed} value
 * @returns {Object}
 */
function propertyChange (name, value) {
    var obj = {};
    obj[name] = value;
    return obj;
}

module.exports = protean.inherit(Rx.Observable, Record,/** @lends Record# */{
    /**
     * @param {String} key
     * @returns {Boolean}
     */
    has: function (key) { return this.properties.hasOwnProperty(key); },
    /**
     * Get an individual property, or get all properties as an object.
     * @param {String} [key]
     * @returns {external:Rx.Observable<Mixed|Object>}
     */
    get: function () {
        var arglen = arguments.length,
            key = arguments[0],
            hasKey = this.has(key);

        if (arglen && hasKey) {
            return this.properties[key].take(1);
        }
        else if (arglen && !hasKey) {
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
     * @param {Function} [validator]
     * @returns {Record} the record instance
     */
    createProperty: function (key, value, validator) {
        var prop = new Property(value, validator);
        this.properties[key] = prop;

        prop.
            select(propertyChange.bind(null, key)).
            takeUntil(this.destroyed).
            subscribe(this._updates);

        return prop;
    },
    /**
     * @returns {external:Rx.Observable}
     */
    save: function () {
    },

    destroy: function () {
        var destroyed = this._destroyed;

        if (!destroyed.isStopped) {
            destroyed.onNext();
            destroyed.onCompleted();
        }
    },

    onNext: function (values) { this.set(values); },

    onError: function (error) { this._updates.onError(error); },

    onCompleted: function () { this._updates.onCompleted(); },

    dispose: function () {
    },

    _subscribe: function () {
        var v = this.values;
        return v.subscribe.apply(v, arguments);
    }
});
