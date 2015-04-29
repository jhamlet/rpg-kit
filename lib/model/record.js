var protean = require('protean'),
    Rx = require('../util/rx'),
    _ = require('../util/underscore'),
    begetIfDifferent = _.begetIfDifferent,
    apply = Function.prototype.apply;
/**
 * @class Record
 * @extends external:Rx.Observable
 * @mixes external:Rx.Observer
 * @param {Object} [values]
 */
function Record (values) {
    var addProp = this.addProperty.bind(this),
        initialProps = this.getInitialProperties(),
        startValues = initialProps || {},
        errors = {};

    Record.superclass.call(this, this._subscribe.bind(this));
    /**
     * @private
     * @property {Object<String,Rx.BehaviorSubject>}
     */
    this._properties = {};
    /**
     * @private
     * @property {Object<String,Function>}
     */
    this._validators = {};
    /**
     * @private
     * @property {Rx.Subject}
     */
    this._errors = new Rx.Subject();
    /**
     * @private
     * @property {Rx.Subject}
     */
    this._changes = new Rx.Subject();
    /**
     * @property {Rx.Observable<Object<String,Mixed>>}
     */
    this.changes = 
        this.
        _changes.
        scan(changes, changes.update.bind(changes)).
        debounce(0).
        doAction(changes.reset.bind(changes)).
        publish().
        refCount();
    /**
     * @property {Rx.Observable<Object<String,Error>>}
     */
    this.errors =
        this.
        _errors.
        scan(errors, function (acc, msg) {
            _.
            pairs(msg).
            each(function (args) {
                var k = args[0],
                    v = args[1];

                if (v === null) {
                    delete acc[k];
                }
                else {
                    acc[k] = v;
                }
            });

            return acc;
        }).
        debounce(0).
        publishValue(errors).
        refCount();
    /**
     * @property {Rx.Observable<Object<String,Mixed>>}
     */
    this.values =
        this.
        _changes.
        scan(startValues, begetIfDifferent).
        distinctUntilChanged().
        publishValue(startValues).
        refCount();
    /**
     * @private
     * @property {Rx.AsyncSubject}
     */
    this._destroyed = new Rx.AsyncSubject();
    /**
     * @property {Rx.Observable}
     */
    this.destroyed = this._destroyed.asObservable();

    if (initialProps) {
        _.keys(initialProps).
            forEach(function (key) {
                addProp(initialProps[key]);
            });
    }

    if (values) { this.set(values); }

    if (this.collection) {
        this.collection.add(this);
    }
}

function propertyChange (key, value) {
    var o = {};
    o[key] = value;
    return o;
}

module.exports = protean.inherit(Rx.Observable, Record,/** @lends Record# */{
    collection: null,
    /**
     * Get the initial properties for this record. Defaults to an empty object.
     * @returns {Object}
     */
    getInitialProperties: function () { return {}; },
    /**
     * @param {String} key
     * @returns {Boolean}
     */
    has: function (key) { return this._properties.hasOwnProperty(key); },
    /**
     * Get an individual property, or get all properties as an object.
     * @param {String} [key]
     * @returns {external:Rx.Observable<Mixed|Object>}
     */
    get: function (/*key*/) {
        var arglen = arguments.length,
            key = arguments[0],
            hasKey = this.has(key);

        if (arglen && hasKey) {
            return this._properties[key].take(1);
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
            values;

        if (arglen === 1) {
            values = arguments[0];
            _.
                chain(values).
                pairs().
                each(apply.bind(this.setProperty, this)).
                value();
        }
        else {
            this.setProperty(arguments[0], arguments[1]);
        }

        return this;
    },
    /**
     * Validate that the given property value should be what is given. Throw an
     * Error if it is not of the right type/format. The value for that property
     * will not be changed.
     * @param {String} key
     * @param {Mixed} value
     * @throws {Error}
     * @returns {Mixed} The value to use
     */
    validateProperty: function (key, value) {
        var fn = this._validators[key];

        if (fn) {
            value = fn(value);
        }

        return value;
    },
    /**
     * Add a property to this record
     * @param {String} key
     * @param {Mixed} value
     * @param {Function} [validator]
     * @returns {Record} the record instance
     */
    addProperty: function (key, value, validator) {
        var errors = this._errors,
            msg,
            errored,
            prop;

        if (validator) {
            this._validators[key] = validator;
        }

        if (!this.has(key)) {

            try {
                value = this.validateProperty(key, value);
            }
            catch (error) {
                errored = true;
                msg = {};
                msg[key] = error;
                errors.onNext(msg);
            }

            prop = new Rx.BehaviorSubject(errored ? null : value);
            this._properties[key] = prop;
            prop.key = key;

            prop.
                select(propertyChange.bind(null, key)).
                subscribe(this._changes);
        }
        else {
            this.setProperty(key, value);
        }

        return this;
    },
    /**
     * @param {String} key
     * @param {Mixed} value
     * @returns {Record} the record instance
     */
    setProperty: function (key, value) {
        var props = this._properties,
            errors = this._errors,
            prop,
            msg,
            errored;

        if (!this.has(key)) {
            return this.addProperty(key, value);
        }

        prop = props[key];
        msg = {};

        try {
            value = this.validateProperty(key, value);
        }
        catch (error) {
            errored = true;
            msg[key] = error;
            errors.onNext(msg);
        }

        if (!errored) {
            prop.onNext(value);
            msg[key] = null;
            errors.onNext(msg);
        }

        return this;
    },
    /**
     * @param {String} key
     * @returns {Record} the record instance
     */
    removeProperty: function (key) {
        var prop;

        if (this.has(key)) {
            prop = this._properties[key];
            prop.onCompleted();
            prop.dispose();
            delete this._properties[key];
            delete this._validators[key];
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
    /**
     * Remove the record from it's collection, if any.
     */
    remove: function () {
    },

    onNext: function (values) { this.set(values); },

    onError: function (error) { this._changes.onError(error); },

    onCompleted: function () {
        var changes = this._changes;

        if (!changes.isStopped) {
            changes.onCompleted();
        }
    },

    dispose: function () {
        var changes = this._changes;

        if (!changes.isDisposed) {
            changes.dispose();
        }
    },

    _subscribe: function () {
        var v = this.values;
        return v.subscribe.apply(v, arguments);
    }
});
