var _ = require('underscore');

_.mixin({
    begetIfDifferent: function begetIfDifferent (a, b) {
        if (!_.isMatch(a, b)) {
            a = _.extend({}, a, b);
        }
        return a;
    }
});
