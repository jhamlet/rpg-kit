var protean = require('protean'),
    Rx = require('../util/rx'),
    // _ = require('../util/underscore'),
    checkDisposed = Rx.Disposable.checkDisposed;
/**
 * @class Property
 * @extends external:Rx.Observable
 * @mixes external:Rx.Observer
 * @param {Mixed} [value]
 * @param {Function} [validator]
 */
function Property (value, validator) {
    Property.superclass.call(this, this._subscribe.bind(this));
    /**
     * @private
     * @property {external:Rx.BehaviorSubject}
     */
    this._subject = new Rx.BehaviorSubject();
    /**
     * @property {Function}
     */
    this.validator = validator;

    this.onNext(value);
}

module.exports = protean.inherit(Rx.Observable, Property,/** @lends Property# */{
    /**
     * @property {Mixed}
     */
    get value () { return this._subject.value; },

    set value (v) { this.onNext(v); },
    /**
     * @returns {Boolean}
     */
    hasObservers: function () { return this._subject.observers.length > 0; },
    /**
     * @param {Mixed} value
     */
    onNext: function (value) {
        var s = this._subject,
            validator = this.validator,
            invalid,
            os, len, i;

        checkDisposed(s);
        if (s.hasError) { return; }

        if (validator) {
            try {
                validator(value, s.value);
            }
            catch (error) {
                invalid = true;
                os = s.observers.slice();
                len = os.length;
                s.value = error;
                for (i = 0; i < len; i++) {
                    os[i].onNext(error);
                }
            }
        }

        if (!invalid) {
            s.onNext(value);
        }
    },
    /**
     * @param {Error}
     */
    onError: function (error) { this._subject.onError(error); },
    /**
     * Complete the property. It's value can still be retrieved, but it will not
     * change with any onNexts, or sets.
     */
    onCompleted: function () { this._subject.onCompleted(); },
    /**
     * Dispose of the property.
     */
    dispose: function () {
        this._subject.dispose();
        this.validator = null;
    },
    /**
     * @private
     * @param {external:Rx.Observer} observer
     */
    _subscribe: function (observer) {
        return this._subject.subscribe(observer);
    }
});
