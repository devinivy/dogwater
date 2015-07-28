// Load modules
var Lab = require('lab');
var Code = require('code');
var Hapi = require('hapi');
var Items = require('items');
var Path = require('path');
var Waterline = require('waterline');
var Memory = require('sails-memory');

// Test shortcuts
var lab = exports.lab = Lab.script();
var expect = Code.expect;
var beforeEach = lab.beforeEach;
var afterEach = lab.afterEach;
var experiment = lab.experiment;
var test = lab.test;


experiment('Dogwater', function () {

    // This will be a hapi server for each test.
    var server;

    // Setup dummy connections/adapters.
    var connections = {
        'my_foo': {
            adapter: 'foo'
        }
    };

    var dummyAdapters = { foo: {} };

    var failureAdapters = 666;

    // Pass adapters as string
    var stringsAdapters = { foo: 'sails-memory' };

    // Setup adapters for testing fixtures.
    var fixtureAdapters = { foo: Memory };

    var modelsFile = './models.definition.js';
    var fixturesFile = './models.fixtures.json';

    // Setup hapi server to register the plugin
    beforeEach(function (done) {

        server = new Hapi.Server();
        server.connection();
        done();
    });

    // Setup Hapi server to register the plugin
    afterEach(function (done) {

        server.plugins.dogwater.teardown(done)
    });

    test('takes its models option as a path.', function (done) {

        var options = {
            connections: connections,
            adapters: dummyAdapters,
            models: Path.normalize(__dirname + '/' + modelsFile)
        };

        var plugin = {
           register: require('..'),
           options: options
        };

        server.register(plugin, function (err) {

            expect(err).to.not.exist();
            done();
        });

    });

    test('takes its adapters option as a string.', function (done) {

        var options = {
            connections: connections,
            adapters: stringsAdapters,
            models: Path.normalize(__dirname + '/' + modelsFile)
        };

        var plugin = {
           register: require('..'),
           options: options
        };

        server.register(plugin, function (err) {

            expect(err).to.not.exist();
            done();
        });

    });

    test('takes its models option as an array.', function (done) {

        var options = {
            connections: connections,
            adapters: dummyAdapters,
            models: require(modelsFile)
        };

        var plugin = {
           register: require('..'),
           options: options
        };

        server.register(plugin, function (err) {

            expect(err).to.not.exist();
            done();
        });

    });

    test('errors if the models option is not an array or string.', function (done) {

        var options = {
            connections: connections,
            adapters: dummyAdapters,
            models: { some: 'object' }
        };

        var plugin = {
           register: require('..'),
           options: options
        };

        server.register(plugin, function (err) {

            expect(err).to.exist();
            done();
        });

    });


    test('exposes Waterline collections to server.', function (done) {
        // Via model definitions, this verifies that a definition can be a function
        // to which waterline is passed and from which a definition is returned.

        var options = {
            connections: connections,
            adapters: dummyAdapters,
            models: require(modelsFile)
        };

        var plugin = {
           register: require('..'),
           options: options
        };

        server.register(plugin, function (err) {

            var dogwater = server.plugins.dogwater;

            expect(err).not.to.exist();
            expect(dogwater.collections.bar).to.be.an.object();
            expect(dogwater.collections.zoo).to.be.an.object();
            done();
        });

    });

    test('exposes Waterline collections to request.', function (done) {

        var options = {
            connections: connections,
            adapters: dummyAdapters,
            models: require(modelsFile)
        };

        var plugin = {
           register: require('..'),
           options: options
        };

        server.register(plugin, function (err) {

            expect(err).not.to.exist();

            server.route({
                path: '/',
                method: 'GET',
                handler: function (request, reply) {

                    var collections = request.collections;

                    expect(collections.bar).to.be.an.object();
                    expect(collections.zoo).to.be.an.object();

                    reply({});
                }
            });

            server.inject({ url: '/', method: 'GET' }, function (response) {

                done();
            });
        });

    });

    test('loads fixtures using waterline-fixtures.', function (done) {

        var options = {
            connections: connections,
            adapters: fixtureAdapters,
            models: require(modelsFile),
            data: {
                fixtures: require(fixturesFile)
            }
        };

        var plugin = {
           register: require('..'),
           options: options
        };

        server.register(plugin, function (err) {

            expect(err).to.not.exist();

            var collections = server.plugins.dogwater.collections;

            dogwater.bar.find()
            .then(function (bars) {

                dogwater.zoo.find()
                .then(function (zoos) {

                    expect(bars).to.have.length(2);
                    expect(zoos).to.have.length(1);

                    done();
                });

            });
        });

    });

    test('exposes waterline through a server method.', function (done) {

        var options = {
            connections: connections,
            adapters: dummyAdapters,
            models: require(modelsFile)
        };

        var plugin = {
           register: require('..'),
           options: options
        };

        server.register(plugin, function (err) {

            expect(err).to.not.exist();
            expect(server.waterline).to.be.instanceof(Waterline);
            done();
        });

    });

    test('errors on fail.', function (done) {

        var options = {
            connections: connections,
            adapters: fixtureAdapters,
            models: require(modelsFile)
        };

        var plugin = {
           register: require('..'),
           options: options
        };

        server.register(plugin, function (err) {

            expect(err).to.not.exist();

            // Fail by reusing adapter
            server.register(plugin, function (err) {

                expect(err).to.exist();
                done();
            });

        });

    });

});
