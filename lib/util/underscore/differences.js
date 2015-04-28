var _ = require('underscore');

_.mixin({
    differences: function differences (acc, current) {
        var previous;

        if (typeof acc !== 'object' && !_.isArray(acc)) {
            previous = acc;
            acc = {};
            acc.previous = previous;
        }
        else {
            acc.previous = acc.current;
        }

        acc.current = current;

        return acc;
    }
});
