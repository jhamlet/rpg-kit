/*globals describe, beforeEach, it*/
var RecordChanges = require('../../../lib/model/record/changes'),
    Rx = require('../../../lib/util/rx');

require('should');

function onError (error) { throw error; }

describe('RecordChanges', function () {
    describe('#values', function () {
        var r;
        
        beforeEach(function () {
            r = new RecordChanges();
        });

        it('should only onNext once per stack trace', function (done) {
            var expected = [
                    {},
                    { foo: 'bar', bar: 'foo' }
                ],
                count = 0;

            r.subscribe(
                function (map) {
                    map.should.eql(expected[count]);
                    count++;
                },
                onError,
                done
            );

            r.onNext({ foo: 'bar' });
            r.onNext({ bar: 'foo' });

            r.onCompleted();
        });

        it('should onNext the last set of changes on subscribing', function (done) {
            r.onNext({ foo: 'bar' });
            r.onNext({ bar: 'foo' });

            Rx.Observable.
            timer(0).
                take(1).
                selectMany(function () { return r; }).
                subscribe(
                    function (map) {
                        map.should.eql({ foo: 'bar', bar: 'foo' });
                    },
                    onError,
                    done
                );
        });
    });
});
