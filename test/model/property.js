/*globals describe, it*/
var Property = require('../../lib/model/property'),
    // Rx = require('../../lib/util/rx'),
    _ = require('../../lib/util/underscore');

require('should');

function onError (error) { throw error; }

describe('Property', function () {
    describe('#constructor([value], [validator])', function () {
        it('value should default to undefined', function () {
            var p = new Property();
            (p.value === undefined).should.be.true;
        });

        it('value should be the same as given', function () {
            var p = new Property('foo');
            p.value.should.equal('foo');
        });

        it('should set the validator property', function () {
            var p;

            function validate (/*newValue, oldValue*/) {
            }

            p = new Property(null, validate);
            p.validator.should.equal(validate);
        });
    });

    describe('#hasObservers()', function () {
        var p = new Property();

        it('should return false if no observers', function () {
            p.hasObservers().should.be.false;
        });

        it('should return true if observed', function () {
            p.subscribe(_.noop);
            p.hasObservers().should.be.true;
        });
    });

    describe('#onNext(value)', function () {
        var p = new Property(0, function (value/*, old*/) {
                if (typeof value !== 'number') {
                    throw new Error();
                }
            });

        it('should onNext values', function (done) {
            p.
                skip(1).
                take(1).
                subscribe(
                    function (value) {
                        value.should.equal(2);
                    },
                    onError,
                    done
                );

            p.onNext(2);
        });

        it('should onNext an Error if validation fails', function (done) {
            p.
                skip(1).
                take(1).
                subscribe(
                    function (value) {
                        value.should.be.instanceOf(Error);
                        p.value.should.equal(value);
                    },
                    onError,
                    done
                );

            p.onNext('foo');
        });
    });

    describe('#dispose()', function () {
        var p = new Property(0, _.noop);

        it('should dispose of underlying subject, and remove validation function', function () {
            var s = p._subject;

            p.dispose();
            s.isDisposed.should.be.true;
            (s.observers === null).should.be.true;
            (s.value === null).should.be.true;
            (p.validator === null).should.be.true;
        });
    });

    describe('#subscribe(observerOrOnNext, [onError], [onCompleted])', function () {
        var p = new Property(null);

        it('should onNext the initial value when subscribed to', function (done) {
            p.
                take(1).
                subscribe(
                    function (value) {
                        (value === null).should.be.true;
                    },
                    onError,
                    done
                );
        });

    });
});
