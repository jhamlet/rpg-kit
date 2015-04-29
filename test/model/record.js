/*globals describe, beforeEach, it*/
var Record = require('../../lib/model/record'),
    Rx = require('../../lib/util/rx');

require('should');

function onError (error) { throw error; }

describe('Record', function () {
    describe('#values', function () {
        var r;
        
        beforeEach(function () {
            r = new Record({ foo: 'foo' });
        });

        it('should onNext values as they change', function (done) {
            var expected = [
                    { foo: 'foo' },
                    { foo: 'bar' },
                    { foo: 'bar', bar: 'foo' },
                ],
                count = 0;

            r.
                take(expected.length).
                subscribe(
                    function (values) {
                        // console.log('%j', values);
                        values.should.eql(expected[count]);
                        count++;
                    },
                    onError,
                    done
                );

            r.set('foo', 'bar');
            r.set('bar', 'foo');
        });

        it('should create distinct objects when properties change', function (done) {
            r.
                toArray().
                subscribe(
                    function (args) {
                        args[0].should.not.equal(args[1]);
                    },
                    onError,
                    done
                );

            r.set('foo', 'bar');
            r.onCompleted();
        });

        it('should not create distinct objects when properties do not change', function (done) {
            r.
                toArray().
                subscribe(
                    function (args) {
                        args[0].should.equal(args[1]);
                    },
                    onError,
                    done
                );

            r.set('foo', 'foo');
            r.onCompleted();
        });
    });

    describe('#changes', function () {
        var r;

        beforeEach(function () {
            r = new Record({ foo: 'foo' });
        });

        it('should only onNext what has changed', function (done) {
            r.
                subscribe(
                    function (next) {
                    },
                    onError,
                    done
                );
        });
    });

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
            r.get().should.be.instanceOf(Rx.Observable);
        });
    });
});
