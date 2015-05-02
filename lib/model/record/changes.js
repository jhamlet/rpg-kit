var protean = require('protean'),
    Rx = require('../../util/rx'),
    _ = require('../../util/underscore');
/**
 * @class RecordChanges
 * @extends external:Rx.Observable
 * @mixes external:Rx.Observer
 */
function RecordChanges () {
    var subject = new Rx.Subject();

    _.bindAll(this, 'value', 'update', 'reset', '_subscribe');

    RecordChanges.superclass.call(this, this._subscribe);

    this.reset();

    this.subject = subject;
}

module.exports = protean.inherit(Rx.Observable, RecordChanges,
    /** @lends RecordChanges# */{
    /**
     * @property {Rx.Observable<Object<String,Mixed>>}
     * @readonly
     */
    get values () {
        if (!this.__values) {
            this.__values =
                this.
                subject.
                    scan(this, this.update).
                    debounce(0).
                    select(this.value).
                    doAction(this.reset).
                    publishValue(this.value()).
                    refCount();
        }
        return this.__values;
    },
    /**
     * @returns {Object}
     */
    value: function () { return this._map; },
    /**
     * @param {RecordChanges} self
     * @param {Object} props
     * @returns {RecordChanges}
     */
    update: function (self, props) {
        _.extend(self._map, props);
        return self;
    },

    add: function (attr) {
        attr.
            select(function (v) {
                var o = {};
                o[attr.key] = v;
                return o;
            }).
            subscribe(this.onNext.bind(this), this.onError.bind(this));
        
        return this;
    },
    /**
     */
    reset: function () { this._map = {}; },

    onNext: function (props) { this.subject.onNext(props); },
    onError: function (error) { this.subject.onError(error); },
    onCompleted: function () { this.subject.onCompleted(); },
    /**
     */
    dispose: function () {
        this.subject.dispose();
        this._map = null;
    },
    /**
     * @param {external:Rx.Observer} observer
     * @returns {external:Rx.Disposable}
     */
    _subscribe: function (observer) {
        return this.values.subscribe(observer);
    }
});

