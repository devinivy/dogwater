// Load modules
var Lab = require('lab');
var Code = require('code');
var Hapi = require('hapi');
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
        'myFoo': {
            adapter: 'foo'
        }
    };

    var dummyAdapters = { foo: {} };

    var defaults = { migrate: 'safe' };

    // Pass adapters as string
    var stringAdapters = { foo: 'sails-memory' };

    // Setup adapters for testing fixtures
    var fixtureAdapters = { foo: Memory };

    // Fail upon registering a connection
    var failureAdapters = {
        foo: {
            registerConnection: function (one, two, cb) {

                cb(new Error('Adapter test error!'));
            }
        }
    };

    // Teardown tests
    var teardownSuccessAdapters = {
        foo: {
            identity: 'foo',
            teardown: function (cb) {

                toreDown = true;
                cb();
            }
        }
    };

    var teardownNoIdAdapters = {
        foo: {
            teardown: function (cb) {

                toreDown = true;
                cb();
            }
        }
    };

    var teardownNoMethodAdapters = {
        foo: {
            identity: 'foo'
        }
    };

    var modelsRawFile = './models.definition.raw.js';
    var modelsFuncFile = './models.definition.funcs.js';
    var fixturesFile = './models.fixtures.json';

    var performTeardown;
    var toreDown;

    // Setup hapi server to register the plugin
    beforeEach(function (done) {

        server = new Hapi.Server();
        server.connection();

        performTeardown = true;
        toreDown = false;

        done();
    });

    // Teardown unless the test dictates otherwise
    afterEach(function (done) {

        if (performTeardown) {
            server.plugins.dogwater.teardown(done);
        } else {
            done();
        }
    });

    test('takes its `models` option as a relative path.', function (done) {

        var options = {
            connections: connections,
            adapters: dummyAdapters,
            models: Path.normalize('./test/' + modelsRawFile)
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

    test('takes its `models` option as an absolute path.', function (done) {

        var options = {
            connections: connections,
            adapters: dummyAdapters,
            models: Path.normalize(__dirname + '/' + modelsRawFile)
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

    test('takes its `models` option as an array of objects.', function (done) {

        var options = {
            connections: connections,
            adapters: dummyAdapters,
            models: require(modelsRawFile)
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

    test('takes its `models` option as an array of functions returning objects.', function (done) {

        var options = {
            connections: connections,
            adapters: dummyAdapters,
            models: require(modelsFuncFile)
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

    test('throws if the `models` option is not an array or string.', function (done) {

        var options = {
            connections: connections,
            adapters: dummyAdapters,
            models: { some: 'object' }
        };

        var plugin = {
            register: require('..'),
            options: options
        };

        expect(function () {

            server.register(plugin, function (err) {

                // We should never get here
                expect(true).to.not.equal(true);
            });
        }).to.throw('Model definitions need to be specified as an array or path to be required.');

        performTeardown = false;

        done();
    });

    test('takes its `adapters` specified as a string.', function (done) {

        var options = {
            connections: connections,
            adapters: stringAdapters,
            models: Path.normalize(__dirname + '/' + modelsRawFile)
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

    test('exposes Waterline collections, connections, and schema.', function (done) {

        var options = {
            connections: connections,
            adapters: dummyAdapters,
            models: require(modelsRawFile)
        };

        var plugin = {
            register: require('..'),
            options: options
        };

        server.register(plugin, function (err) {

            expect(err).not.to.exist();

            var collections = server.plugins.dogwater.collections;
            var conns = server.plugins.dogwater.connections;
            var schema = server.plugins.dogwater.schema;

            expect(collections.bar).to.be.an.object();
            expect(collections.zoo).to.be.an.object();

            expect(conns).to.be.an.object();
            expect(conns.myFoo).to.be.an.object();
            expect(conns.myFoo._collections).to.once.include(['bar', 'zoo']);

            expect(schema).to.be.an.object();
            expect(schema.bar).to.be.an.object();
            expect(schema.zoo).to.be.an.object();
            expect(schema.bar.identity).to.equal('bar');
            expect(schema.zoo.identity).to.equal('zoo');

            done();
        });

    });

    test('passes its `defaults` option to waterline.', function (done) {

        var options = {
            connections: connections,
            adapters: dummyAdapters,
            models: require(modelsRawFile),
            defaults: defaults
        };

        var plugin = {
            register: require('..'),
            options: options
        };

        server.register(plugin, function (err) {

            expect(err).to.not.exist();

            var collections = server.plugins.dogwater.collections;
            expect(collections.bar.migrate).to.equal('create');
            expect(collections.zoo.migrate).to.equal('safe');

            done();
        });

    });

    test('exposes connection teardown method, skips when method missing.', function (done) {

        var options = {
            connections: connections,
            adapters: teardownNoMethodAdapters,
            models: require(modelsRawFile)
        };

        var plugin = {
            register: require('..'),
            options: options
        };

        server.register(plugin, function (err) {

            expect(err).not.to.exist();

            var teardown = server.plugins.dogwater.teardown;

            expect(toreDown).to.equal(false);
            teardown(function (err) {

                expect(err).to.not.exist();
                expect(toreDown).to.equal(false);
                done();
            });
        });

    });

    test('exposes connection teardown method, succeeds when adapter identity missing.', function (done) {

        var options = {
            connections: connections,
            adapters: teardownNoIdAdapters,
            models: require(modelsRawFile)
        };

        var plugin = {
            register: require('..'),
            options: options
        };

        server.register(plugin, function (err) {

            expect(err).not.to.exist();

            var teardown = server.plugins.dogwater.teardown;

            expect(toreDown).to.equal(false);
            teardown(function (err) {

                expect(err).to.not.exist();
                expect(toreDown).to.equal(true);
                done();
            });
        });

    });

    test('exposes connection teardown method, succeeds with identity and method.', function (done) {

        var options = {
            connections: connections,
            adapters: teardownSuccessAdapters,
            models: require(modelsRawFile)
        };

        var plugin = {
            register: require('..'),
            options: options
        };

        server.register(plugin, function (err) {

            expect(err).not.to.exist();

            var teardown = server.plugins.dogwater.teardown;

            expect(toreDown).to.equal(false);
            teardown(function (err) {

                expect(err).to.not.exist();
                expect(toreDown).to.equal(true);
                done();
            });
        });

    });

    test('decorates Waterline collections onto request.', function (done) {

        var options = {
            connections: connections,
            adapters: dummyAdapters,
            models: require(modelsRawFile)
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

    test('decorates Waterline onto the server.', function (done) {

        var options = {
            connections: connections,
            adapters: dummyAdapters,
            models: require(modelsRawFile)
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

    test('exposes the raw ORM to the model definition when the definition is specified as a function.', function (done) {

        var options = {
            connections: connections,
            adapters: dummyAdapters,
            models: require(modelsFuncFile)
        };

        var plugin = {
            register: require('..'),
            options: options
        };

        server.register(plugin, function (err) {

            expect(err).to.not.exist();

            var Bar = server.waterline.collections.bar;
            var Zoo = server.waterline.collections.zoo;

            expect(Bar).to.be.an.object();
            expect(Zoo).to.be.an.object();
            expect(Bar.iHaveWaterline()).to.equal(server.waterline);
            expect(Zoo.iHaveWaterline()).to.equal(server.waterline);
            done();
        });

    });

    test('loads fixtures using waterline-fixtures with a standard object configuration.', function (done) {

        var options = {
            connections: connections,
            adapters: fixtureAdapters,
            models: require(modelsRawFile),
            fixtures: {
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

            collections.bar.find()
            .then(function (bars) {

                collections.zoo.find()
                .then(function (zoos) {

                    expect(bars).to.have.length(2);
                    expect(zoos).to.have.length(1);

                    done();
                });

            });
        });

    });

    test('loads fixtures using waterline-fixtures with fixture data directly specified.', function (done) {

        var options = {
            connections: connections,
            adapters: fixtureAdapters,
            models: require(modelsRawFile),
            fixtures: require(fixturesFile)
        };

        var plugin = {
            register: require('..'),
            options: options
        };

        server.register(plugin, function (err) {

            expect(err).to.not.exist();

            var collections = server.plugins.dogwater.collections;

            collections.bar.find()
            .then(function (bars) {

                collections.zoo.find()
                .then(function (zoos) {

                    expect(bars).to.have.length(2);
                    expect(zoos).to.have.length(1);

                    done();
                });

            });
        });

    });

    test('errors on Waterline failure.', function (done) {

        var options = {
            connections: connections,
            adapters: failureAdapters,
            models: require(modelsRawFile)
        };

        var plugin = {
            register: require('..'),
            options: options
        };

        server.register(plugin, function (err) {

            expect(err).to.exist();
            expect(err.message).to.equal('Adapter test error!');

            performTeardown = false;

            done();
        });

    });

});
