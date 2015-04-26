var protean = require('protean'),
    Rx = require('../util/rx'),
    // _ = require('../util/underscore'),
    checkDisposed = Rx.Disposable.checkDisposed;
/**
 * @class Property
 * @extends external:Rx.Observable
 * @mixes external:Rx.Observer
 * @param {Mixed} value
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

module.exports = protean.inherit(Rx.Observable, Property, {
    /**
     * @property {Mixed}
     */
    get value () { return this._subject.value; },

    set value (v) { this.onNext(v); },
    /**
     * @returns {Boolean}
     */
    hasObservers: function () { return this.observers.length > 0; },
    /**
     * @param {Mixed} value
     */
    onNext: function (value) {
        var s = this._subject,
            validator = this.validator,
            os, len, i;

        checkDisposed(s);
        if (s.hasError) {
            return;
        }

        if (validator) {
            try {
                validator(value, s.value);
            }
            catch (error) {
                os = s.observers.slice();
                len = os.length;
                for (i = 0; i < len; i++) {
                    os[i].onError(error);
                }
            }
        }

        s.onNext(value);
    },
    /**
     * @param {Error}
     */
    onError: function (error) { this._subject.onError(error); },

    onCompleted: function () { this._subject.onCompleted(); },

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
