var _ = require('underscore');

_.mixin({
    valueOf: function valueOf (obj) {
        return typeof obj.valueOf === 'function' ?
            obj.valueOf() :
            Object.prototype.valueOf.call(obj);
    }
});
