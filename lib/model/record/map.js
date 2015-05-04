var protean = require('protean'),
    _ = require('../../util/underscore');

function Map () {
    this.clear();
}

module.exports = protean.classify(Map,/** @lends Map# */{
    get: function () {
        var map = this._map;

        if (arguments.length === 0) {
            return map;
        }

        return _.
            toArray(arguments).
            reduce(function (acc,  cur) {
                acc[cur] = map[cur];
                return acc;
            }, {});
    },

    set: function () {
        var args = arguments.length === 1 ?
                arguments[0] :
                _.enmap.apply(_, arguments);

        _.extend(this._map, args);

        return this;
    },

    clear: function () { this._map = {}; }
});
