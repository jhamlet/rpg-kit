var protean = require('protean'),
    rx = require('../../util/rx'),
    recordattributes = require('./attributes');
/**
 * @class record
 * @extends external:rx.observable
 * @mixes external:rx.observer
 * @param {object} [values]
 */
function record (values) {
    record.superclass.call(this, this._subscribe.bind(this));
    /**
     * @property {recordattributes}
     */
    this.attributes = new recordattributes(this.attributes, values);
    /**
     * @property {recorderrors}
     */
    this.errors = this.attributes.errors;
    /**
     * @property {recordchanges}
     */
    this.changes = this.attributes.changes;
    /**
     * @property {recordvalues}
     */
    this.values = this.attributes.values;
    /**
     * @private
     * @property {rx.asyncsubject}
     */
    this._destroyed = new rx.asyncsubject();
    /**
     * @property {rx.observable}
     */
    this.destroyed = this._destroyed.asobservable();

    if (this.collection) {
        this.collection.add(this);
    }
}

protean.augment(record,/** @lends record */{
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

module.exports = protean.inherit(rx.observable, record,/** @lends record# */{
    collection: null,
    /**
     * @property {object<string,mixed>}
     */
    attributes: {},
    /**
     * @property {object<string,function>}
     */
    validators: {},
    /**
     * @param {string} key
     * @returns {boolean}
     */
    has: function (key) { return this.attributes.has(key); },
    /**
     * get an individual attribute, or get all attributes as an object.
     * @param {string} [key]
     * @returns {external:rx.observable<mixed|object>}
     */
    get: function (/*key*/) {
        var a = this.attributes;
        return a.get.apply(a, arguments);
    },
    /**
     * @param {string} [key]
     * @param {mixed} [value]
     * @param {object<string,mixed>} [values]
     * @returns {record} the record instance
     */
    set: function (/*keyorobject, value*/) {
        var a = this.attributes;
        a.set.apply(a, arguments);
        return this;
    },
    /**
     * add a attribute to this record
     * @param {string} key
     * @param {mixed} value
     * @param {function} [validator]
     * @returns {record} the record instance
     */
    addattribute: function (key, value, validator) {
        this.attributes.add(key, value, validator);
        return this;
    },
    /**
     * @param {string} key
     * @param {mixed} value
     * @returns {record} the record instance
     */
    setattribute: function (key, value) {
        this.attributes.set(key, value);
        return this;
    },
    /**
     * @param {string} key
     * @returns {record} the record instance
     */
    removeattribute: function (key) {
        this.attributes.remove(key);
        return this;
    },
    /**
     * destroy this record instance, freeing any resources and disposing of any
     * outstanding subscriptions.
     */
    destroy: function () {
        var destroyed = this._destroyed;

        if (!destroyed.isstopped) {
            this.oncompleted();
            this.dispose();

            destroyed.onnext();
            destroyed.oncompleted();
        }
    },
    /**
     * remove the record from it's collection, if any.
     */
    remove: function () {
    },

    onnext: function (values) { this.attributes.set(values); },

    onerror: function (error) { this.attributes.onerror(error); },

    oncompleted: function () {
        var attributes = this.attributes;

        if (!attributes.isstopped) {
            attributes.oncompleted();
        }
    },

    dispose: function () {
        var attributes = this.attributes;

        if (!attributes.isdisposed) {
            attributes.dispose();
        }
    },

    _subscribe: function () {
        var v = this.values;
        return v.subscribe.apply(v, arguments);
    }
});
