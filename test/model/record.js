/*globals describe, it*/
var Record = require('../../lib/model/record'),
    Rx = require('../../lib/util/rx');

require('should');

describe('Record', function () {
    describe('#has(key)', function () {
        var r = new Record({ foo: 'foo' });

        it('should return true if record has the property', function () {
            r.has('foo').should.be.true;
        });

        it('should return false if record does not have the property', function () {
            r.has('bar').should.be.false;
        });
    });

    describe('#get([key]', function () {
        var r = new Record({ foo: 'foo', bar: 'bar' });

        it('should return an Observable', function () {
            r.get('foo').should.be.instanceOf(Rx.Observable);
            r.get('baz').should.be.instanceOf(Rx.Observable);
            // r.get().should.be.instanceOf(Rx.Observable);
        });
    });
});
