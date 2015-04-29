var RecordMap = require('./map');
/**
 * @class RecordChanges
 * @extends RecordMap
 */
function RecordChanges () {
    RecordChanges.superclass.call(this);
}

module.exports = RecordMap.extend(RecordChanges);

