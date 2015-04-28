var protean = require('protean'),
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

module.exports = protean.inherit(Rx.Observable, Record,/** @lends Record# */{
    /**
     * Get the initial properties for this record. Defaults to an empty object.
     * @returns {Object}
     */
    getInitialProperties: function () { return {}; },
    /**
     * Validate that the given property value should be what is given. Throw an
     * Error if it is not of the right type/format. The value for that property
     * will not be changed.
     * @param {String} key
     * @param {Mixed} value
     * @throws {Error}
     */
    validate: function (/*key, value*/) {},
    /**
     * @param {String} key
     * @returns {Boolean}
     */
    has: function (key) { return this.properties.hasOwnProperty(key); },
    /**
     * Get an individual property, or get all properties as an object.
     * @param {...String} [key]
     * @returns {external:Rx.Observable<Mixed|Object>}
     */
    get: function (/*...key*/) {
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
    set: function (/*keyOrObject, value*/) {
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
     * Destroy this record instance, freeing any resources and disposing of any
     * outstanding subscriptions.
     */
    destroy: function () {
        var destroyed = this._destroyed;

        if (!destroyed.isStopped) {
            this.onCompleted();
            this.dispose();

            destroyed.onNext();
            destroyed.onCompleted();
        }
    },

    onNext: function (values) { this.set(values); },

    onError: function (error) { this._updates.onError(error); },

    onCompleted: function () {
        var updates = this._updates;

        if (!updates.isStopped) {
            updates.onCompleted();
        }
    },

    dispose: function () {
        var updates = this._updates;

        if (!updates.isDisposed) {
            updates.dispose();
        }
    },

    _subscribe: function () {
        var v = this.values;
        return v.subscribe.apply(v, arguments);
    }
});
