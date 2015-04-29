var protean = require('protean'),
    Rx = require('../../util/rx'),
    _ = require('../../util/underscore');
/**
 * @class RecordErrors
 * @extends external:Rx.Observable
 * @mixes external:Rx.Observer
 */
function RecordErrors () {
    var subject = new Rx.Subject();

    _.bindAll(this, 'value', 'update', 'reset', '_subscribe');

    RecordErrors.superclass.call(this, this._subscribe);

    this.reset();

    this.subject = subject;
}

module.exports = protean.inherit(Rx.Observable, RecordErrors,
    /** @lends RecordErrors# */{
    /**
     * @property {Rx.Observable<Object<String,Error>>}
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
        _.
            pairs(props).
            each(function (args) {
                var k = args[0],
                    v = args[1];

                if (v === null) {
                    delete self._map[k];
                }
                else {
                    self._map[k] = v;
                }
            });

        return self;
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

