'use strict';

// Load modules

const Lab = require('lab');
const Code = require('code');
const Hapi = require('hapi');
const Path = require('path');
const Waterline = require('waterline');

// Test shortcuts

const lab = exports.lab = Lab.script();
const expect = Code.expect;
const beforeEach = lab.beforeEach;
const afterEach = lab.afterEach;
const experiment = lab.experiment;
const test = lab.test;

experiment('Dogwater', () => {

    // This will be a hapi server for each test.
    let server;

    // Setup dummy connections/adapters.
    const connections = {
        'myFoo': {
            adapter: 'foo'
        }
    };

    const dummyAdapters = { foo: {} };

    const defaults = { migrate: 'safe' };

    // Pass adapters as string
    const stringAdapters = { foo: 'sails-memory' };

    // Fail upon registering a connection
    const failureAdapters = {
        foo: {
            registerConnection: (one, two, cb) => {

                cb(new Error('Adapter test error!'));
            }
        }
    };

    // Teardown tests
    const teardownSuccessAdapters = {
        foo: {
            identity: 'foo',
            teardown: (conn, cb) => {

                toreDown = true;
                cb();
            }
        }
    };

    const teardownNoIdAdapters = {
        foo: {
            teardown: (conn, cb) => {

                toreDown = true;
                cb();
            }
        }
    };

    const teardownNoMethodAdapters = {
        foo: {
            identity: 'foo'
        }
    };

    const modelsRawFile = './models.definition.raw.js';
    const modelsFuncFile = './models.definition.funcs.js';

    let performTeardown;
    let toreDown;

    // Setup hapi server to register the plugin
    beforeEach((done) => {

        server = new Hapi.Server();
        server.connection();

        performTeardown = true;
        toreDown = false;

        done();
    });

    // Teardown unless the test dictates otherwise
    afterEach((done) => {

        if (performTeardown) {
            server.plugins.dogwater.teardown(done);
        }
        else {
            done();
        }
    });

    test('takes its `models` option as a relative path.', (done) => {

        const options = {
            connections: connections,
            adapters: dummyAdapters,
            models: Path.normalize('./test/' + modelsRawFile)
        };

        const plugin = {
            register: require('..'),
            options: options
        };

        server.register(plugin, (err) => {

            expect(err).to.not.exist();
            done();
        });

    });

    test('takes its `models` option as an absolute path.', (done) => {

        const options = {
            connections: connections,
            adapters: dummyAdapters,
            models: Path.normalize(__dirname + '/' + modelsRawFile)
        };

        const plugin = {
            register: require('..'),
            options: options
        };

        server.register(plugin, (err) => {

            expect(err).to.not.exist();
            done();
        });

    });

    test('takes its `models` option as an array of objects.', (done) => {

        const options = {
            connections: connections,
            adapters: dummyAdapters,
            models: require(modelsRawFile)
        };

        const plugin = {
            register: require('..'),
            options: options
        };

        server.register(plugin, (err) => {

            expect(err).to.not.exist();
            done();
        });

    });

    test('takes its `models` option as an array of functions returning objects.', (done) => {

        const options = {
            connections: connections,
            adapters: dummyAdapters,
            models: require(modelsFuncFile)
        };

        const plugin = {
            register: require('..'),
            options: options
        };

        server.register(plugin, (err) => {

            expect(err).to.not.exist();
            done();
        });

    });

    test('throws if the `models` option is not an array or string.', (done) => {

        const options = {
            connections: connections,
            adapters: dummyAdapters,
            models: { some: 'object' }
        };

        const plugin = {
            register: require('..'),
            options: options
        };

        expect(() => {

            server.register(plugin, (err) => {

                expect(err).to.not.exist();

                // We should never get here
                expect(true).to.not.equal(true);
            });
        }).to.throw('Model definitions need to be specified as an array or path to be required.');

        performTeardown = false;

        done();
    });

    test('takes its `adapters` specified as a string.', (done) => {

        const options = {
            connections: connections,
            adapters: stringAdapters,
            models: Path.normalize(__dirname + '/' + modelsRawFile)
        };

        const plugin = {
            register: require('..'),
            options: options
        };

        server.register(plugin, (err) => {

            expect(err).to.not.exist();
            done();
        });

    });

    test('exposes Waterline collections, connections, and schema.', (done) => {

        const options = {
            connections: connections,
            adapters: dummyAdapters,
            models: require(modelsRawFile)
        };

        const plugin = {
            register: require('..'),
            options: options
        };

        server.register(plugin, (err) => {

            expect(err).not.to.exist();

            const collections = server.plugins.dogwater.collections;
            const conns = server.plugins.dogwater.connections;
            const schema = server.plugins.dogwater.schema;

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

    test('passes its `defaults` option to waterline.', (done) => {

        const options = {
            connections: connections,
            adapters: dummyAdapters,
            models: require(modelsRawFile),
            defaults: defaults
        };

        const plugin = {
            register: require('..'),
            options: options
        };

        server.register(plugin, (err) => {

            expect(err).to.not.exist();

            const collections = server.plugins.dogwater.collections;
            expect(collections.bar.migrate).to.equal('create');
            expect(collections.zoo.migrate).to.equal('safe');

            done();
        });

    });

    test('exposes connection teardown method, skips when method missing.', (done) => {

        const options = {
            connections: connections,
            adapters: teardownNoMethodAdapters,
            models: require(modelsRawFile)
        };

        const plugin = {
            register: require('..'),
            options: options
        };

        server.register(plugin, (err) => {

            expect(err).not.to.exist();

            const teardown = server.plugins.dogwater.teardown;

            expect(toreDown).to.equal(false);
            teardown((err) => {

                expect(err).to.not.exist();
                expect(toreDown).to.equal(false);
                done();
            });
        });

    });

    test('exposes connection teardown method, succeeds when adapter identity missing.', (done) => {

        const options = {
            connections: connections,
            adapters: teardownNoIdAdapters,
            models: require(modelsRawFile)
        };

        const plugin = {
            register: require('..'),
            options: options
        };

        server.register(plugin, (err) => {

            expect(err).not.to.exist();

            const teardown = server.plugins.dogwater.teardown;

            expect(toreDown).to.equal(false);
            teardown((err) => {

                expect(err).to.not.exist();
                expect(toreDown).to.equal(true);
                done();
            });
        });

    });

    test('exposes connection teardown method, succeeds with identity and method.', (done) => {

        const options = {
            connections: connections,
            adapters: teardownSuccessAdapters,
            models: require(modelsRawFile)
        };

        const plugin = {
            register: require('..'),
            options: options
        };

        server.register(plugin, (err) => {

            expect(err).not.to.exist();

            const teardown = server.plugins.dogwater.teardown;

            expect(toreDown).to.equal(false);
            teardown((err) => {

                expect(err).to.not.exist();
                expect(toreDown).to.equal(true);
                done();
            });
        });

    });

    test('decorates Waterline collections onto request.', (done) => {

        const options = {
            connections: connections,
            adapters: dummyAdapters,
            models: require(modelsRawFile)
        };

        const plugin = {
            register: require('..'),
            options: options
        };

        server.register(plugin, (err) => {

            expect(err).not.to.exist();

            server.route({
                path: '/',
                method: 'GET',
                handler: (request, reply) => {

                    const collections = request.collections;

                    expect(collections.bar).to.be.an.object();
                    expect(collections.zoo).to.be.an.object();

                    reply({});
                }
            });

            server.inject({ url: '/', method: 'GET' }, (response) => {

                done();
            });
        });

    });

    test('decorates Waterline onto the server.', (done) => {

        const options = {
            connections: connections,
            adapters: dummyAdapters,
            models: require(modelsRawFile)
        };

        const plugin = {
            register: require('..'),
            options: options
        };

        server.register(plugin, (err) => {

            expect(err).to.not.exist();
            expect(server.waterline).to.be.instanceof(Waterline);
            done();
        });

    });

    test('exposes the raw ORM to the model definition when the definition is specified as a function.', (done) => {

        const options = {
            connections: connections,
            adapters: dummyAdapters,
            models: require(modelsFuncFile)
        };

        const plugin = {
            register: require('..'),
            options: options
        };

        server.register(plugin, (err) => {

            expect(err).to.not.exist();

            const Bar = server.waterline.collections.bar;
            const Zoo = server.waterline.collections.zoo;

            expect(Bar).to.be.an.object();
            expect(Zoo).to.be.an.object();
            expect(Bar.iHaveWaterline()).to.shallow.equal(server.waterline);
            expect(Zoo.iHaveWaterline()).to.shallow.equal(server.waterline);
            done();
        });

    });

    test('errors on Waterline failure.', (done) => {

        const options = {
            connections: connections,
            adapters: failureAdapters,
            models: require(modelsRawFile)
        };

        const plugin = {
            register: require('..'),
            options: options
        };

        server.register(plugin, (err) => {

            expect(err).to.exist();
            expect(err.message).to.equal('Adapter test error!');

            performTeardown = false;

            done();
        });

    });

});
