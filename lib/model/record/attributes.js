var protean = require('protean'),
    Rx = require('../../util/rx'),
    _ = require('../../util/underscore'),
    Changes = require('./changes'),
    Errors = require('./errors'),
    Values = require('./values'),
    apply = Function.prototype.apply;

function RecordAttributes (attrSpec, values) {

    this.members = {};
    this.validators = {};

    this.errors = new Errors();
    this.changes = new Changes();
    this.values = new Values(this.changes);

    _.
        keys(attrSpec).
        map(function (key) { return [key, attrSpec[key].value, attrSpec[key].fn]; }).
        forEach(apply.bind(null, this));

    if (values) {
        this.set(values);
    }
}

module.exports = protean.inherit(Rx.Observable, RecordAttributes,
    /** @lends RecordAttributes# */{
    /**
     * @param {String} key
     * @returns {Boolean}
     */
    has: function (key) {
        return this.members.hasOwnProperty(key);
    },
    /**
     * @param {String} [key]
     * @returns {external:Rx.Observable<Mixed|Object>}
     */
    get: function () {
    },
    /**
     * @param {String} [key]
     * @param {Mixed} [value]
     * @param {Object<String,Mixed>} [values]
     * @returns {RecordAttributes} the attribute instance
     */
    set: function () {
    },
    /**
     * @param {String} key
     * @param {Mixed} value
     * @returns {Rx.Observable<Mixed>}
     */
    validate: function (key, value) {
        var fn = this.validators[key];

        return fn ?
            Rx.Observable.defer(function () {
                value = fn(value);

                if (!(value instanceof Rx.Observable)) {
                    value = Rx.Observable.return(value);
                }

                return value;
            })
            :
            Rx.Observable.return(value);
    },
    /**
     * @param {String} key
     * @param {Mixed} [value]
     * @param {ValidatorFunction} [validator]
     * @returns {RecordAttributes} the attribute instance
     */
    add: function (key, value, validator) {
        var attributes = this.members,
            attr = attributes[key],
            addAttr = this._addAttribute.bind(this, key),
            errors = this.errors;

        if (attr) {
            this.remove(key);
        }

        if (validator) {
            this.validators[key] = validator;
        }

        this.
        validate(key, value).
            subscribe(
                addAttr,
                function (error) {
                    addAttr(key);
                    error.key = key;
                    errors.onNext(error);
                }
            );

        return this;
    },
    /**
     * @private
     * @param {String} key
     * @param {Mixed} value
     */
    _addAttribute: function (key, value) {
        var attr = new Rx.BehaviorSubject(value);

        attr.key = key;
        this.members[key] = attr;
        this.changes.add(attr);
    },
    /**
     * @param {String} key
     * @returns {RecordAttributes} the attribute instance
     */
    remove: function (key) {
        var attr = this.members[key];

        if (attr) {
            attr.onCompleted();
            attr.dispose();
            delete this.members[key];
        }

        return this;
    },

    onNext: function (values) { this.set(values); },
    onError: function (error) { this.changes.onError(error); },
    onCompleted: function () {
    },

    dispose: function () {
    },

    _subscribe: function (observer) {
        return this.values.subscribe(observer);
    }
});
