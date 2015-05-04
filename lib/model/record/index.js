var protean = require('protean'),
    Rx = require('../../util/rx'),
    _ = require('../../util/underscore'),
    Map = require('../../util/map'),
    MapImmutable = require('../../util/map-immutable'),
    apply = Function.prototype.apply;
/**
 * @class Record
 * @extends external:Rx.Observable
 * @mixes external:Rx.Observer
 * @param {Object} [values]
 */
function Record (values) {
    Record.superclass.call(this, this._subscribe.bind(this));
    /**
     * @property {Object<String,external:Rx.BehaviorSubject>}
     */
    this.attributes = {};
    /**
     * @private
     * @property {external:Rx.Subject}
     */
    this._changes = new Rx.Subject();
    /**
     * @property {Object<String,Error>}
     */
    this._errors = {};
    /**
     * @private
     * @property {Rx.AsyncSubject}
     */
    this._destroyed = new Rx.AsyncSubject();
    /**
     * @property {Rx.Observable}
     */
    this.destroyed = this._destroyed.asObservable();

    // initial attributes
    Rx.Observable.
        fromArray(_.pairs(this.constructor.prototype.attributes)).
        selectMany(function (args) {
            return this.add(args[0], args[1].value, args[1].fn);
        }.bind(this)).
        subscribe(_.noop);

    if (values) {
        this.set(values).subscribe(_.noop);
    }

    if (this.collection) {
        this.collection.add(this);
    }
}

protean.augment(Record,/** @lends Record */{
    extended: function (subclass) {
        var superproto = this.prototype,
            subproto = subclass.prototype;

        // pass on our attributes
        subproto.attributes =
            protean.augment(Object.create(superproto.attributes), subproto.attributes);

        // and our extended method
        subclass.extended = this.extended;
    }
});

module.exports = protean.inherit(Rx.Observable, Record,/** @lends Record# */{
    collection: null,
    /**
     * @property {Object<String,Mixed>}
     */
    attributes: {},
    /**
     * @property {external:Rx.Observable<Object>}
     * @readonly
     */
    get changes () {
        var map;

        if (!this.__changes) {
            map = new Map();
            _.bind(map, ['extend', 'valueOf', 'clear']);
            this.__changes =
                this.
                _changes.
                scan(map, map.extend).
                throttle(0).
                select(map.valueOf).
                doAction(map.clear).
                publishValue(map.valueOf).
                refCount();
        }

        return this.__changes;
    },

    get values () {
        var map;

        if (!this.__values) {
            map = new MapImmutable();
            _.bind(map, ['extend', 'valueOf']);
            this.__values =
                this.
                changes.
                scan(map, map.extend).
                select(map.valueOf).
                publishValue(map.valueOf).
                refCount();
        }
        return this.__values;
    },
    /**
     * @param {String} key
     * @returns {Boolean}
     */
    has: function (key) { return this.attributes.hasOwnProperty(key); },
    /**
     * @param {String}   key
     * @param {Mixed}    value
     * @param {Function} [fn]
     * @returns {external:Rx.Observable}
     */
    validate: function (key, value, fn) {
        var attr = this.attributes[key];

        fn = fn || attr && attr.validator;

        return fn ?
            Rx.Observable.defer(function () {
                value = fn(value);

                if (!value || !value.subscribe) {
                    value = Rx.Observable.return(value);
                }

                return value;
            })
            :
            Rx.Observable.return(value);
    },
    /**
     * Get an individual attribute, or get all attributes as an object.
     * @param {String} [key]
     * @returns {external:Rx.Observable<Mixed|external:Rx.Observable<Mixed>>}
     */
    get: function (/*key*/) {
        if (arguments.length > 0) {
            return this.attributes[arguments[0]] || Rx.Observable.empty();
        }
        return Rx.Observable.fromArray(_.values(this.attributes));
    },
    /**
     * @param {String} [keyOrObject]
     * @param {Mixed} [value]
     * @param {Object<String,Mixed>} [keyOrObject]
     * @returns {external:Rx.Observable<Boolean|external:Rx.Observable<Boolean>>}
     * the record instance
     */
    set: function (/*keyOrObject, value*/) {
        var arglen = arguments.length,
            errors = this._errors,
            keyOrObject = arguments[0],
            attr,
            value;

        if (arglen === 1) {
            return Rx.Observable.
                fromArray(_.pairs(keyOrObject)).
                selectMany(apply.bind(this.set, this));
        }

        value = arguments[1];
        attr = this.attributes[keyOrObject];

        if (!attr) {
            return this.add(keyOrObject, value);
        }

        return this.
            validate(keyOrObject, value).
            take(1).
            doAction(function (v) { attr.onNext(v); }).
            select(_.identity.bind(_, true)).
            catch(function (error) {
                errors[keyOrObject] = error;
                return Rx.Observable.value(false);
            });
    },
    /**
     * Add a attribute to this record
     * @param {String} key
     * @param {Mixed} value
     * @param {Function} [validator]
     * @returns {external:Rx.Observable<Boolean>} the record instance
     */
    add: function (key, value, validator) {
        var attrs = this.attributes,
            attr = attrs[key],
            add = this._add.bind(this, key, validator);

        if (attr) {
            this.remove(key);
        }

        return this.
            validate(key, value, validator).
            take(1).
            select(add).
            catch(add);
    },
    /**
     * @private
     * @param {String} key
     * @param {Function} validator
     * @param {Error|Mixed} value
     * @returns {true|external:Rx.Observable<false>}
     */
    _add: function (key, validator, value) {
        var isError = value instanceof Error,
            errors = this._errors,
            attrs = this.attributes,
            attr;

        if (isError) {
            attr = new Rx.BehaviorSubject();
            errors[key] = value;
        }
        else {
            attr = new Rx.BehaviorSubject(value);
        }

        attr.key = key;
        attr.validator = validator;

        attrs[key] = attr;

        attr.
            distinctUntilChanged().
            select(_.enmap.bind(_, key)).
            subscribe(this._changes);

        if (isError) {
            throw value;
        }

        return value;
    },
    /**
     * @param {String} key
     * @returns {Record} the record instance
     */
    delete: function (key) {
        var attr = this.attributes[key];

        if (attr) {
            attr.onCompleted();
            attr.dispose();
            delete attr.validator;
            delete this.attributes[key];
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

    onError: function (error) { },

    onCompleted: function () {
        var attributes = this.attributes;

        if (!attributes.isStopped) {
            attributes.onCompleted();
        }
    },

    dispose: function () {
        var attributes = this.attributes;

        if (!attributes.isDisposed) {
            attributes.dispose();
        }
    },

    _subscribe: function (observer) {
        return this.values.subscribe(observer);
    }
});
