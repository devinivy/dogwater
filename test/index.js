'use strict';

// Load modules

const Lab = require('lab');
const Code = require('code');
const Hapi = require('hapi');
const Path = require('path');
const Waterline = require('waterline');
const ModelsFixture = require('./models');
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

    it('decorates Waterline onto the server.', (done) => {

        getServer({}, (err, server) => {

            expect(err).not.to.exist();
            expect(server.waterline).to.be.instanceof(Waterline);
            done();
        });
    });

    it('initializes Waterline during onPreStart.', (done) => {

        const options = {
            connections: connections,
            adapters: dummyAdapters,
            models: ModelsFixture
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
            adapters: {
                myAdapter: {
                    registerConnection: (x, y, cb) => {

                        cb(new Error('Adapter test error!'));
                    }
                }
            },
            models: ModelsFixture
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
            models: ModelsFixture
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
            models: ModelsFixture,
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

    describe('plugin registration', () => {

        it('takes `models` option as a relative path.', (done) => {

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

        it('takes `models` option as an absolute path.', (done) => {

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

        it('takes `models` option as an array of objects.', (done) => {

            const options = {
                connections: connections,
                adapters: dummyAdapters,
                models: ModelsFixture
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

        it('takes `adapters` specified as a string.', (done) => {

            const adapters = { myAdapter: 'sails-memory' };

            const options = {
                connections: connections,
                adapters: adapters,
                models: Path.normalize(__dirname + '/' + modelsFile)
            };

            getServer(options, (err, server) => {

                expect(err).to.not.exist();

                const collector = state(server).collector;
                expect(collector.adapters.myAdapter).to.shallow.equal(adapters.myAdapter);

                done();
            });
        });

        it('passes `defaults` option to Waterline.', (done) => {

            const options = {
                connections: connections,
                adapters: dummyAdapters,
                models: ModelsFixture,
                defaults: { migrate: 'safe' }
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

        it('throws when specific `defaults` are specified more than once.', (done) => {

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
    });

    describe('server.dogwater() decoration', () => {

        it('aggregates models, connections, and adapters across plugins.', (done) => {

            const options = {
                connections: connections,
                adapters: dummyAdapters,
                models: ModelsFixture
            };

            getServer(options, (err, server) => {

                expect(err).to.not.exist();

                const plugin1 = (srv, opts, next) => {

                    srv.dogwater({
                        connections: { oneConnection: { adapter: 'twoAdapter' } },
                        adapters: { oneAdapter: {} },
                        models: [{
                            identity: 'onemodel',
                            connection: 'twoConnection'
                        }]
                    });
                    next();
                };

                plugin1.attributes = { name: 'plugin-one' };

                const plugin2 = (srv, opts, next) => {

                    srv.dogwater({
                        connections: { twoConnection: { adapter: 'oneAdapter' } },
                        adapters: { twoAdapter: {} },
                        models: [{
                            identity: 'twomodel',
                            connection: 'oneConnection'
                        }]
                    });
                    next();
                };

                plugin2.attributes = { name: 'plugin-two' };

                server.register([plugin1, plugin2], (err) => {

                    expect(err).to.not.exist();

                    server.initialize((err) => {

                        expect(err).to.not.exist();

                        const waterline = server.waterline;
                        const collections = waterline.collections;
                        const conns = waterline.connections;

                        expect(collections.thismodel.identity).to.equal('thismodel');
                        expect(collections.thatmodel.identity).to.equal('thatmodel');
                        expect(collections.onemodel.identity).to.equal('onemodel');
                        expect(collections.twomodel.identity).to.equal('twomodel');

                        expect(conns.myConnection).to.contain({ config: { adapter: 'myAdapter' } });
                        expect(conns.oneConnection).to.contain({ config: { adapter: 'twoAdapter' } });
                        expect(conns.twoConnection).to.contain({ config: { adapter: 'oneAdapter' } });

                        done();
                    });
                });
            });
        });

        it('aggregates model definitions within a plugin.', (done) => {

            getServer({ models: [{ identity: 'strangemodel' }] }, (err, server) => {

                expect(err).to.not.exist();

                const rootState = state(server);
                expect(Object.keys(rootState.collector.models)).to.equal(['strangemodel']);

                const plugin = (srv, opts, next) => {

                    srv.dogwater(ModelsFixture[0]);
                    srv.dogwater(ModelsFixture[1]);
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

        it('accepts a single model definition.', (done) => {

            getServer({}, (err, server) => {

                expect(err).to.not.exist();

                const plugin = (srv, opts, next) => {

                    srv.dogwater(ModelsFixture[0]);
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

        it('accepts an array of model definitions.', (done) => {

            getServer({}, (err, server) => {

                expect(err).to.not.exist();

                const plugin = (srv, opts, next) => {

                    srv.dogwater(ModelsFixture);
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

        it('throws on model identity collision.', (done) => {

            const options = {
                connections: connections,
                adapters: dummyAdapters,
                models: ModelsFixture
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

        it('throws on connection name collision.', (done) => {

            const options = {
                connections: connections,
                adapters: dummyAdapters,
                models: ModelsFixture
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
                models: ModelsFixture
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
    });

    describe('request.collections() and server.collections() decorations', () => {

        it('return empty object before server initialization.', (done) => {

            const options = {
                connections: connections,
                adapters: dummyAdapters,
                models: ModelsFixture
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

                expect(server.collections()).to.equal({});
                expect(server.collections(true)).to.equal({});

                server.inject({ url: '/', method: 'get' }, (response) => {

                    expect(response.result).to.equal({ ok: true });
                    done();
                });
            });
        });

        it('solely return collections registered in route\'s realm by default.', (done) => {

            const options = {
                connections: connections,
                adapters: dummyAdapters,
                models: [ModelsFixture[0]]
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
                server.ext('onPreStart', (_, nxt) => {

                    const collections = server.collections();
                    expect(collections).to.have.length(1);
                    expect(collections.thismodel.identity).to.equal('thismodel');
                    nxt();
                });

                const plugin = (srv, opts, next) => {

                    srv.dogwater(ModelsFixture[1]);
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
                    srv.ext('onPreStart', (_, nxt) => {

                        const collections = srv.collections();
                        expect(collections).to.have.length(1);
                        expect(collections.thatmodel.identity).to.equal('thatmodel');
                        nxt();
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

        it('return empty object from if no models defined in route\'s realm.', (done) => {

            const options = {
                connections: connections,
                adapters: dummyAdapters,
                models: ModelsFixture
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
                    srv.ext('onPreStart', (_, nxt) => {

                        const collections = srv.collections();
                        expect(collections).to.be.an.object();
                        expect(collections).to.have.length(0);
                        nxt();
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

        it('return collections across all realms when passed true.', (done) => {

            const options = {
                connections: connections,
                adapters: dummyAdapters,
                models: [ModelsFixture[0]]
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
                server.ext('onPreStart', (_, nxt) => {

                    const collections = server.collections(true);
                    expect(collections).to.have.length(2);
                    expect(collections.thismodel.identity).to.equal('thismodel');
                    expect(collections.thatmodel.identity).to.equal('thatmodel');
                    nxt();
                });

                const plugin = (srv, opts, next) => {

                    srv.dogwater(ModelsFixture[1]);
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
                    srv.ext('onPreStart', (_, nxt) => {

                        const collections = srv.collections(true);
                        expect(collections).to.have.length(2);
                        expect(collections.thismodel.identity).to.equal('thismodel');
                        expect(collections.thatmodel.identity).to.equal('thatmodel');
                        nxt();
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
    });
});
