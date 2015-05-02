var protean = require('protean'),
    Rx = require('../../util/rx'),
    RecordAttributes = require('./attributes');
/**
 * @class Record
 * @extends external:Rx.Observable
 * @mixes external:Rx.Observer
 * @param {Object} [values]
 */
function Record (values) {
    Record.superclass.call(this, this._subscribe.bind(this));
    /**
     * @property {RecordAttributes}
     */
    this.attributes = new RecordAttributes(this.attributes, values);
    /**
     * @property {RecordErrors}
     */
    this.errors = this.attributes.errors;
    /**
     * @property {RecordChanges}
     */
    this.changes = this.attributes.changes;
    /**
     * @property {RecordValues}
     */
    this.values = this.attributes.values;
    /**
     * @private
     * @property {Rx.AsyncSubject}
     */
    this._destroyed = new Rx.AsyncSubject();
    /**
     * @property {Rx.Observable}
     */
    this.destroyed = this._destroyed.asObservable();

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
            protean.augment(superproto.attributes, subproto.attributes);
        // and our validators
        subproto.validators =
            protean.augment(superproto.validators, subproto.validators);
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
     * @param {String} key
     * @returns {Boolean}
     */
    has: function (key) { return this.attributes.has(key); },
    /**
     * Get an individual attribute, or get all attributes as an object.
     * @param {String} [key]
     * @returns {external:Rx.Observable<Mixed|Object>}
     */
    get: function (/*key*/) {
        var a = this.attributes;
        return a.get.apply(a, arguments);
    },
    /**
     * @param {String} [key]
     * @param {Mixed} [value]
     * @param {Object<String,Mixed>} [values]
     * @returns {Record} the record instance
     */
    set: function (/*keyOrObject, value*/) {
        var a = this.attributes;
        a.set.apply(a, arguments);
        return this;
    },
    /**
     * Add a attribute to this record
     * @param {String} key
     * @param {Mixed} value
     * @param {Function} [validator]
     * @returns {Record} the record instance
     */
    addAttribute: function (key, value, validator) {
        this.attributes.add(key, value, validator);
        return this;
    },
    /**
     * @param {String} key
     * @param {Mixed} value
     * @returns {Record} the record instance
     */
    setAttribute: function (key, value) {
        this.attributes.set(key, value);
        return this;
    },
    /**
     * @param {String} key
     * @returns {Record} the record instance
     */
    removeAttribute: function (key) {
        this.attributes.remove(key);
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

    onNext: function (values) { this.attributes.set(values); },

    onError: function (error) { this.attributes.onError(error); },

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
        return this.attributes.subscribe(observer);
    }
});
