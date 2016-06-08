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
const describe = lab.describe;
const it = lab.it;

describe('Dogwater', () => {

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
            registerConnection: (x, y, cb) => {

                cb(new Error('Adapter test error!'));
            }
        }
    };

    const modelsRawFile = './models.definition.raw.js';

    let performTeardown;

    // Setup hapi server to register the plugin
    beforeEach((done) => {

        server = new Hapi.Server();
        server.connection();

        performTeardown = true;

        done();
    });

    // Teardown unless the test dictates otherwise
    afterEach((done) => {

        if (performTeardown) {
            return server.waterline.teardown(done);
        }

        return done();
    });

    it('takes its `models` option as a relative path during registration.', (done) => {

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

            performTeardown = false;
            done();
        });

    });

    it('takes its `models` option as an absolute path during registration.', (done) => {

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

            performTeardown = false;
            done();
        });

    });

    it('takes its `models` option as an array of objects during registration.', (done) => {

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

            performTeardown = false;
            done();
        });

    });

    it('throws if the `models` option is not an array or string.', (done) => {

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

            server.register(plugin, (ignoreErr) => {

                done(new Error('Should not make it here.'));
            });
        }).to.throw(/^Bad plugin options passed to dogwater\./);

        performTeardown = false;
        done();
    });

    it('takes its `adapters` specified as a string during registration.', (done) => {

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

            performTeardown = false;
            done();
        });

    });

    it('decorates Waterline onto the server.', (done) => {

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

            expect(server.waterline).to.be.instanceof(Waterline);

            server.initialize((err) => {

                expect(err).not.to.exist();

                const collections = server.waterline.collections;
                const conns = server.waterline.connections;
                const schema = server.waterline.schema;

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

    });

    it('passes its `defaults` option to waterline during registration.', (done) => {

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

            server.initialize((err) => {

                expect(err).to.not.exist();

                const collections = server.waterline.collections;
                expect(collections.bar.migrate).to.equal('create');
                expect(collections.zoo.migrate).to.equal('safe');

                done();
            });

        });

    });

    it('decorates Waterline collections onto request.', (done) => {

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

                    const collections = request.collections();

                    expect(collections.bar).to.be.an.object();
                    expect(collections.zoo).to.be.an.object();

                    reply({});
                }
            });

            server.initialize((err) => {

                expect(err).not.to.exist();

                server.inject({ url: '/', method: 'GET' }, (response) => {

                    done();
                });
            });

        });

    });

    it('errors on Waterline failure during onPreStart.', (done) => {

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

            expect(err).to.not.exist();

            server.initialize((err) => {

                expect(err).to.exist();
                expect(err.message).to.equal('Adapter test error!');

                performTeardown = false;

                done();
            });

        });

    });

});
