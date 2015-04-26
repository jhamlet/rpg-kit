/*globals describe, it*/
var _ = require('../../../lib/util/underscore');

require('should');

// function onError (error) { throw error; }

describe('_.objectDiff()', function () {
    var previous = { foo: 'foo' },
        current = { foo: 'bar' },
        alternate = { bar: 'buz' };

    it('it should return previous object if current is the same', function () {
        _.objectDiff(previous, previous).should.equal(previous);
    });

    it('should return previous object if values in current are equal', function () {
        var r = _.objectDiff(previous, { foo: 'foo' });
        r.should.equal(previous);
    });

    it('should return a new object if current is different than previous', function () {
        var r = _.objectDiff(previous, current);
        r.should.not.equal(current);
        r.should.not.equal(previous);
        r.should.eql({ foo: 'bar' });
    });

    it('should return a new object with all key/values', function () {
        var r = _.objectDiff(previous, alternate);
        r.should.not.equal(previous);
        r.should.not.equal(alternate);
        r.should.eql({ foo: 'foo', bar: 'buz' });
    });
});
