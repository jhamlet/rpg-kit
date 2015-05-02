var _ = require('../../util/underscore'),
    RecordChanges = require('./map');
/**
 * @class RecordValues
 * @extends RecordChanges
 */
function RecordValues () {
    RecordValues.superclass.call(this, this._subscribe);
}

module.exports = RecordChanges.extend(RecordValues,/** @lends RecordValues# */{
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
                    select(this.value).
                    publishValue(this.value()).
                    refCount();
        }
        return this.__values;
    },
    /**
     * @param {RecordChanges} self
     * @param {Object} props
     * @returns {RecordChanges}
     */
    update: function (self, props) {
        if (!_.isMatch(self._map, props)) {
            _.extend({}, self._map, props);
        }
        return self;
    }
});

