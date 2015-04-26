var _ = require('underscore');

_.mixin({
    /**
     * @param {Object} previous
     * @param {Object} current
     * @returns {Object}
     */
    objectDiff: function (previous, current) {
        if (previous === current || _.matcher(previous)(current)) {
            return previous;
        }

        return _.extend({}, previous, current);
    }
});
