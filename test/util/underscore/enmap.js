/*globals describe, it*/
var _ = require('../../../lib/util/underscore');

require('should');

describe('_.enmap(...keyOrValue)', function () {
    it('should create an object from a list of alternating keys and values', function () {
        _.enmap('foo', 'foo', 'bar', 'bar').
            should.
            eql({
                foo: 'foo',
                bar: 'bar'
            });
    });
});
