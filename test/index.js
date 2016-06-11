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

                return done(new Error('Should not make it here.'));
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

    it('provides empty object from request.collections() before initialization.', (done) => {

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

                    expect(request.collections()).to.equal({});
                    expect(request.collections(true)).to.equal({});
                    reply({ ok: true });
                }
            });

            server.inject({ url: '/', method: 'get' }, (response) => {

                expect(response.result).to.equal({ ok: true });
                done();
            });
        });
    });

    it('provides only models registered in plugin from request.collections().', (done) => {

        const models = require(modelsFile);

        const options = {
            connections: connections,
            adapters: dummyAdapters,
            models: [models[0]]
        };

        getServer(options, (err, server) => {

            expect(err).not.to.exist();

            server.route({
                path: '/root',
                method: 'get',
                handler: (request, reply) => {

                    const collections = request.collections();
                    expect(collections).to.have.length(1);
                    expect(collections.thismodel.identity).to.equal('thismodel');
                    reply({ ok: 'root' });
                }
            });

            const plugin = (srv, opts, next) => {

                srv.dogwater(models[1]);
                srv.route({
                    path: '/plugin',
                    method: 'get',
                    handler: (request, reply) => {

                        const collections = request.collections();
                        expect(collections).to.have.length(1);
                        expect(collections.thatmodel.identity).to.equal('thatmodel');
                        reply({ ok: 'plugin' });
                    }
                });
                next();
            };

            plugin.attributes = { name: 'my-plugin' };

            server.register(plugin, (err) => {

                expect(err).to.not.exist();

                server.initialize((err) => {

                    expect(err).to.not.exist();

                    server.inject({ url: '/root', method: 'get' }, (res1) => {

                        expect(res1.result).to.equal({ ok: 'root' });

                        server.inject({ url: '/plugin', method: 'get' }, (res2) => {

                            expect(res2.result).to.equal({ ok: 'plugin' });
                            done();
                        });
                    });
                });
            });
        });
    });

    it('provides empty object from request.collections() if plugin defined no models.', (done) => {

        const options = {
            connections: connections,
            adapters: dummyAdapters,
            models: require(modelsFile)
        };

        getServer(options, (err, server) => {

            expect(err).not.to.exist();

            const plugin = (srv, opts, next) => {

                srv.route({
                    path: '/',
                    method: 'get',
                    handler: (request, reply) => {

                        const collections = request.collections();
                        expect(collections).to.be.an.object();
                        expect(collections).to.have.length(0);
                        reply({ ok: true });
                    }
                });
                next();
            };

            plugin.attributes = { name: 'my-plugin' };

            server.register(plugin, (err) => {

                expect(err).to.not.exist();

                server.initialize((err) => {

                    expect(err).to.not.exist();

                    server.inject({ url: '/', method: 'get' }, (response) => {

                        expect(response.result).to.equal({ ok: true });
                        done();
                    });
                });
            });
        });
    });

    it('provides all models across plugins from request.collections(true).', (done) => {

        const models = require(modelsFile);

        const options = {
            connections: connections,
            adapters: dummyAdapters,
            models: [models[0]]
        };

        getServer(options, (err, server) => {

            expect(err).not.to.exist();

            server.route({
                path: '/root',
                method: 'get',
                handler: (request, reply) => {

                    const collections = request.collections(true);
                    expect(collections).to.have.length(2);
                    expect(collections.thismodel.identity).to.equal('thismodel');
                    expect(collections.thatmodel.identity).to.equal('thatmodel');
                    reply({ ok: 'root' });
                }
            });

            const plugin = (srv, opts, next) => {

                srv.dogwater(models[1]);
                srv.route({
                    path: '/plugin',
                    method: 'get',
                    handler: (request, reply) => {

                        const collections = request.collections(true);
                        expect(collections).to.have.length(2);
                        expect(collections.thismodel.identity).to.equal('thismodel');
                        expect(collections.thatmodel.identity).to.equal('thatmodel');
                        reply({ ok: 'plugin' });
                    }
                });
                next();
            };

            plugin.attributes = { name: 'my-plugin' };

            server.register(plugin, (err) => {

                expect(err).to.not.exist();

                server.initialize((err) => {

                    expect(err).to.not.exist();

                    server.inject({ url: '/root', method: 'get' }, (res1) => {

                        expect(res1.result).to.equal({ ok: 'root' });

                        server.inject({ url: '/plugin', method: 'get' }, (res2) => {

                            expect(res2.result).to.equal({ ok: 'plugin' });
                            done();
                        });
                    });
                });
            });
        });
    });

    it('initializes Waterline during onPreStart.', (done) => {

        const options = {
            connections: connections,
            adapters: dummyAdapters,
            models: require(modelsFile)
        };

        getServer(options, (err, server) => {

            expect(err).to.not.exist();
            expect(server.waterline.collections).to.not.exist();

            server.initialize((err) => {

                expect(err).to.not.exist();
                expect(server.waterline.collections).to.exist();
                done();
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

    it('aggregates models within a plugin.', (done) => {

        getServer({ models: [{ identity: 'strangemodel' }] }, (err, server) => {

            expect(err).to.not.exist();

            const rootState = state(server);
            expect(Object.keys(rootState.collector.models)).to.equal(['strangemodel']);

            const plugin = (srv, opts, next) => {

                const models = require(modelsFile);
                srv.dogwater(models[0]);
                srv.dogwater(models[1]);
                srv.app.myState = state(srv);
                next();
            };

            plugin.attributes = { name: 'my-plugin' };

            server.register(plugin, (err) => {

                expect(err).to.not.exist();
                expect(server.app.myState.models).to.equal(['thismodel', 'thatmodel']);
                expect(Object.keys(rootState.collector.models)).to.only.contain([
                    'strangemodel',
                    'thismodel',
                    'thatmodel'
                ]);

                done();
            });
        });
    });

    it('server.dogwater() accepts a single model.', (done) => {

        getServer({}, (err, server) => {

            expect(err).to.not.exist();

            const plugin = (srv, opts, next) => {

                srv.dogwater(require(modelsFile)[0]);
                next();
            };

            plugin.attributes = { name: 'my-plugin' };

            server.register(plugin, (err) => {

                expect(err).to.not.exist();

                const collector = state(server).collector;
                expect(collector.models.thismodel).to.exist();

                done();
            });
        });
    });

    it('server.dogwater() accepts an array of models.', (done) => {

        getServer({}, (err, server) => {

            expect(err).to.not.exist();

            const plugin = (srv, opts, next) => {

                srv.dogwater(require(modelsFile));
                next();
            };

            plugin.attributes = { name: 'my-plugin' };

            server.register(plugin, (err) => {

                expect(err).to.not.exist();

                const collector = state(server).collector;
                expect(collector.models.thismodel).to.exist();
                expect(collector.models.thatmodel).to.exist();

                done();
            });
        });
    });

    it('tears-down connections onPostStop.', (done) => {

        let toredown = 0;
        const myAdapter = {
            registerConnection: (x, y, cb) => cb(),
            teardown: (x, cb) => {

                toredown++;
                return cb();
            }
        };

        const options = {
            connections: connections,
            adapters: { myAdapter },
            models: require(modelsFile)
        };

        getServer(options, (err, server) => {

            expect(err).to.not.exist();

            server.initialize((err) => {

                expect(err).to.not.exist();
                expect(toredown).to.equal(0);

                server.ext('onPreStop', (srv, next) => {

                    expect(toredown).to.equal(0);
                    next();
                });

                server.stop((err) => {

                    expect(err).to.not.exist();
                    expect(toredown).to.equal(1);
                    done();
                });
            });

        });

    });

    it('does not tear-down connections onPostStop with option `teardownOnStop` false.', (done) => {

        let toredown = 0;
        const myAdapter = {
            registerConnection: (x, y, cb) => cb(),
            teardown: (x, cb) => {

                toredown++;
                return cb();
            }
        };

        const options = {
            connections: connections,
            adapters: { myAdapter },
            models: require(modelsFile),
            teardownOnStop: false
        };

        getServer(options, (err, server) => {

            expect(err).to.not.exist();

            server.initialize((err) => {

                expect(err).to.not.exist();
                expect(toredown).to.equal(0);

                server.stop((err) => {

                    expect(err).to.not.exist();
                    expect(toredown).to.equal(0);
                    done();
                });
            });

        });

    });

    it('throws when `defaults` are specified more than once.', (done) => {

        const options = { defaults: { x: 1 } };

        getServer(options, (err, server) => {

            expect(err).to.not.exist();

            const plugin = (srv, opts, next) => {

                srv.register({ options, register: Dogwater }, next);
            };

            plugin.attributes = { name: 'my-plugin' };

            expect(() => {

                server.register(plugin, () => done('Should not make it here.'));
            }).to.throw('Default for "x" has already been set.');

            done();
        });

    });

    it('throws on connection name collision.', (done) => {

        const options = {
            connections: connections,
            adapters: dummyAdapters,
            models: require(modelsFile)
        };

        getServer(options, (err, server) => {

            expect(err).to.not.exist();

            const plugin = (srv, opts, next) => {

                srv.dogwater({ connections: { myConnection: {} } });
                next();
            };

            plugin.attributes = { name: 'my-plugin' };

            expect(() => {

                server.register(plugin, () => done('Should not make it here.'));
            }).to.throw('Connection "myConnection" has already been registered.');

            done();
        });

    });

    it('throws on adapter name collision.', (done) => {

        const options = {
            connections: connections,
            adapters: dummyAdapters,
            models: require(modelsFile)
        };

        getServer(options, (err, server) => {

            expect(err).to.not.exist();

            const plugin = (srv, opts, next) => {

                srv.dogwater({ adapters: { myAdapter: {} } });
                next();
            };

            plugin.attributes = { name: 'my-plugin' };

            expect(() => {

                server.register(plugin, () => done('Should not make it here.'));
            }).to.throw('Adapter "myAdapter" has already been registered.');

            done();
        });

    });

    it('throws on model identity collision.', (done) => {

        const options = {
            connections: connections,
            adapters: dummyAdapters,
            models: require(modelsFile)
        };

        getServer(options, (err, server) => {

            expect(err).to.not.exist();

            const plugin = (srv, opts, next) => {

                srv.dogwater({ models: [{ identity: 'thismodel' }] });
                next();
            };

            plugin.attributes = { name: 'my-plugin' };

            expect(() => {

                server.register(plugin, () => done('Should not make it here.'));
            }).to.throw('Model definition with identity "thismodel" has already been registered.');

            done();
        });

    });

    it('throws when `teardownOnStop` is specified more than once.', (done) => {

        const options = { teardownOnStop: false };

        getServer(options, (err, server) => {

            expect(err).to.not.exist();

            const plugin = (srv, opts, next) => {

                srv.register({ options, register: Dogwater }, next);
            };

            plugin.attributes = { name: 'my-plugin' };

            expect(() => {

                server.register(plugin, () => done('Should not make it here.'));
            }).to.throw('Dogwater\'s teardownOnStop option can only be specified once.');

            done();
        });

    });

    it('throws when `defaults` are specified more than once.', (done) => {

        const options = { defaults: { x: 1 } };

        getServer(options, (err, server) => {

            expect(err).to.not.exist();

            const plugin = (srv, opts, next) => {

                srv.register({ options, register: Dogwater }, next);
            };

            plugin.attributes = { name: 'my-plugin' };

            expect(() => {

                server.register(plugin, () => done('Should not make it here.'));
            }).to.throw('Default for "x" has already been set.');

            done();
        });

    });

});
