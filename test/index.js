'use strict';

// Load modules

const Lab = require('lab');
const Code = require('code');
const Hapi = require('hapi');
const Path = require('path');
const Waterline = require('waterline');
const Dogwater = require('..');

// Test shortcuts

const lab = exports.lab = Lab.script();
const expect = Code.expect;
const describe = lab.describe;
const it = lab.it;

describe('Dogwater', () => {

    // Setup dummy connections/adapters.

    const connections = {
        myConnection: {
            adapter: 'myAdapter'
        }
    };

    const dummyAdapters = { myAdapter: {} };

    // Adapter as string
    const stringAdapters = { myAdapter: 'sails-memory' };

    // Fail upon registering a connection
    const failureAdapters = {
        myAdapter: {
            registerConnection: (x, y, cb) => {

                cb(new Error('Adapter test error!'));
            }
        }
    };

    const defaults = { migrate: 'safe' };

    const modelsFile = './models.js';

    const getServer = (options, cb) => {

        const server = new Hapi.Server();
        server.connection();

        server.register({
            register: Dogwater,
            options: options
        }, (err) => {

            if (err) {
                return cb(err);
            }

            return cb(null, server);
        });
    };

    const stop = (server) => {

        return (cb) => server.stop(cb);
    };

    const state = (server) => {

        return server.realm.plugins.dogwater;
    };

    it('takes its `models` option as a relative path during registration.', (done) => {

        const options = {
            connections: connections,
            adapters: dummyAdapters,
            models: Path.normalize('./test/' + modelsFile)
        };

        getServer(options, (err, server) => {

            expect(err).to.not.exist();

            const collector = state(server).collector;
            expect(collector.models.thismodel).to.exist();
            expect(collector.models.thatmodel).to.exist();

            done();
        });

    });

    it('takes its `models` option as an absolute path during registration.', (done) => {

        const options = {
            connections: connections,
            adapters: dummyAdapters,
            models: Path.normalize(__dirname + '/' + modelsFile)
        };

        getServer(options, (err, server) => {

            expect(err).to.not.exist();

            const collector = state(server).collector;
            expect(collector.models.thismodel).to.exist();
            expect(collector.models.thatmodel).to.exist();

            done();
        });

    });

    it('takes its `models` option as an array of objects during registration.', (done) => {

        const options = {
            connections: connections,
            adapters: dummyAdapters,
            models: require(modelsFile)
        };

        getServer(options, (err, server) => {

            expect(err).to.not.exist();

            const collector = state(server).collector;
            expect(collector.models.thismodel).to.exist();
            expect(collector.models.thatmodel).to.exist();

            done();
        });

    });

    it('throws if the `models` option is not an array or string.', (done) => {

        const options = {
            connections: connections,
            adapters: dummyAdapters,
            models: { some: 'object' }
        };

        expect(() => {

            getServer(options, () => {

                done(new Error('Should not make it here.'));
            });
        }).to.throw(/^Bad plugin options passed to dogwater\./);

        done();
    });

    it('takes its `adapters` specified as a string during registration.', (done) => {

        const options = {
            connections: connections,
            adapters: stringAdapters,
            models: Path.normalize(__dirname + '/' + modelsFile)
        };

        getServer(options, (err, server) => {

            expect(err).to.not.exist();

            const collector = state(server).collector;
            expect(collector.adapters.myAdapter).to.shallow.equal(stringAdapters.myAdapter);

            done();
        });

    });

    it('decorates Waterline onto the server.', (done) => {

        const options = {
            connections: connections,
            adapters: dummyAdapters,
            models: require(modelsFile)
        };

        getServer(options, (err, server) => {

            expect(err).not.to.exist();

            expect(server.waterline).to.be.instanceof(Waterline);

            server.initialize((err) => {

                expect(err).not.to.exist();

                const collections = server.waterline.collections;
                const conns = server.waterline.connections;
                const schema = server.waterline.schema;

                expect(collections.thismodel).to.be.an.object();
                expect(collections.thatmodel).to.be.an.object();

                expect(conns).to.be.an.object();
                expect(conns.myConnection).to.be.an.object();
                expect(conns.myConnection._collections).to.once.include(['thismodel', 'thatmodel']);

                expect(schema).to.be.an.object();
                expect(schema.thismodel).to.be.an.object();
                expect(schema.thatmodel).to.be.an.object();
                expect(schema.thismodel.identity).to.equal('thismodel');
                expect(schema.thatmodel.identity).to.equal('thatmodel');

                done();
            });

        });

    });

    it('passes its `defaults` option to Waterline during registration.', (done) => {

        const options = {
            connections: connections,
            adapters: dummyAdapters,
            models: require(modelsFile),
            defaults: defaults
        };

        getServer(options, (err, server) => {

            expect(err).to.not.exist();

            server.initialize((err) => {

                expect(err).to.not.exist();

                const collections = server.waterline.collections;
                expect(collections.thismodel.migrate).to.equal('create');
                expect(collections.thatmodel.migrate).to.equal('safe');

                done();
            });

        });

    });

    it('decorates Waterline collections onto request.', (done) => {

        const options = {
            connections: connections,
            adapters: dummyAdapters,
            models: require(modelsFile)
        };

        getServer(options, (err, server) => {

            expect(err).not.to.exist();

            server.route({
                path: '/',
                method: 'get',
                handler: (request, reply) => {

                    const collections = request.collections();

                    expect(collections.thismodel).to.be.an.object();
                    expect(collections.thatmodel).to.be.an.object();

                    reply({});
                }
            });

            server.initialize((err) => {

                expect(err).not.to.exist();

                server.inject({ url: '/', method: 'get' }, (response) => {

                    done();
                });
            });

        });

    });

    it('errors on Waterline failure during onPreStart.', (done) => {

        const options = {
            connections: connections,
            adapters: failureAdapters,
            models: require(modelsFile)
        };

        getServer(options, (err, server) => {

            expect(err).to.not.exist();

            server.initialize((err) => {

                expect(err).to.exist();
                expect(err.message).to.equal('Adapter test error!');
                done();
            });

        });

    });

});
