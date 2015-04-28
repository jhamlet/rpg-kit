var _ = require('underscore');

_.mixin({
    differences: function differences (acc, current, idx) {
        var previous;

        if (idx > 0 && typeof acc !== 'object') {
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
