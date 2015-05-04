/*globals describe, beforeEach, it*/
var Map = require('../../lib/util/map');

require('should');

describe('Map', function () {
    describe('#constructor(...[key, value])', function () {
        var m = new Map('foo', 'foo', 'bar', 'bar', 'baz', 'baz');

        it('should have the given keys', function () {
            m.keys().should.eql(['foo', 'bar', 'baz']);
        });
    });

    describe('#clear()', function () {
        var m;

        beforeEach(function () {
            m = new Map();
        });

        it('should be a different value', function () {
            var v = m.valueOf();
            m.clear();
            // Need to do direct comparison, because value objects do not share
            // Object.prototype methods
            (m.valueOf() !== v).should.be.true;
        });

        it('should clear its keys', function () {
            m.set('foo', 'foo');
            m.clear();
            m.keys().length.should.be.equal(0);
        });
    });

    describe('#extend(map[, ...map])', function () {
        var m;

        beforeEach(function () {
            m = new Map();
        });

        it('should add the keys and values from the object', function () {
            m.extend({ foo: 'foo', bar: 'bar' });
            m.entries().should.eql([
                ['foo', 'foo'],
                ['bar', 'bar']
            ]);
        });

        it('should add the keys and values from all passed in objects', function () {
            m.extend({ foo: 'foo' }, { bar: 'bar' });
            m.entries().should.eql([
                ['foo', 'foo'],
                ['bar', 'bar']
            ]);
        });
    });

    describe('#has(key)', function () {
        var m;

        beforeEach(function () {
            m = new Map('foo', 'foo');
        });

        it('should return true if it has the given key', function () {
            m.has('foo').should.be.true;
        });

        it('should return false if it does not have the given key', function () {
            m.has('bar').should.be.false;
        });
    });

    describe('#get(key)', function () {
        var m;

        beforeEach(function () {
            m = new Map('foo', 'foo');
        });

        it('should return the value for the given key', function () {
            m.get('foo').should.eql('foo');
        });

        it('should return undefined for unknown keys', function () {
            (m.get('bar') === undefined).should.be.true;
        });
    });

    describe('#set(key, value)', function () {
    });
});
