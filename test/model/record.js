/*globals describe, beforeEach, it*/
var Record = require('../../lib/model/record'),
    Rx = require('../../lib/util/rx'),
    _ = require('../../lib/util/underscore');

require('should');

function onError (error) { throw error; }

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
            r.get().should.be.instanceOf(Rx.Observable);
        });

        it(
            'should return an Observable with the current value for the given key',
            function (done) {
                r.
                    get('foo').
                    take(1).
                    subscribe(
                        function (value) {
                            value.should.equal('foo');
                        },
                        onError,
                        done
                    );
            }
          );

        it('should return an Observable of Observable if no key is given', function (done) {
            r.
                get().
                selectMany(function (a) {
                    return a.
                        take(1).
                        select(function (v) {
                            var o = {};
                            o[a.key] = v;
                            return o;
                        });
                }).
                reduce(_.extend.bind(_)).
                subscribe(
                    function (values) {
                        values.should.eql({ foo: 'foo', bar: 'bar' });
                    },
                    onError,
                    done
                );
        });
    });

    describe('#validate(key, value, [fn])', function () {
        var r = new Record();

        it('should return the validated value', function (done) {
            r.
                validate('foo', 0, function (v) {
                    if (isNaN(parseInt(v, 10))) {
                        throw Error('Foo should be an integer');
                    }
                    return v;
                }).
                take(1).
                subscribe(
                    function (value) {
                        value.should.equal(0);
                    },
                    onError,
                    done
                );
        });

        it('should throw an error when it does not', function (done) {
            var result;

            r.
                validate('foo', 'bar', function (v) {
                    if (isNaN(parseInt(v, 10))) {
                        throw Error('Foo should be an integer');
                    }
                    return v;
                }).
                take(1).
                subscribe(
                    function (value) {
                        result = value;
                    },
                    function (error) {
                        error.message.should.equal('Foo should be an integer');
                        (result === undefined).should.be.true;
                        done();
                    },
                    done
                );
        });

        it('should just return the value if no validator', function (done) {
            r.
                validate('foo', 'bar').
                take(1).
                subscribe(
                    function (value) {
                        value.should.equal('bar');
                    },
                    onError,
                    done
                );
        });
    });
});
