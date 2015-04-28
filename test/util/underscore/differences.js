/*globals describe, it*/
var _ = require('../../../lib/util/underscore'),
    Rx = require('../../../lib/util/rx');

require('should');

function onError (error) { throw error; }

describe('_.differences(diff, current)', function () {
    it('should create a differences object if not given a accumulator', function () {
        var result =
                [0, 1].
                reduce(_.differences);

        result.should.eql({ previous: 0, current: 1 });
    });

    it('should keep the previous and current', function () {
        var result =
                [0, 1, 2, 3, 4, 5].
                reduce(_.differences);

        result.should.eql({ previous: 4, current: 5 });
    });

    it('should work with Rx', function (done) {
        Rx.Observable.
            interval(100).
            take(10).
            reduce(_.differences).
            subscribe(
                function (diff) {
                    diff.previous.should.equal(8);
                    diff.current.should.equal(9);
                },
                onError,
                done
            );
    });
});
