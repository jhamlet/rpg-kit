var _ = require('underscore');

function isEven (a, i) { return i % 2 === 0; }

_.mixin({
    enmap: function enmap () {
        var keyValues = _.partition(arguments, isEven);
        return _.object.apply(_, keyValues);
    }
});
