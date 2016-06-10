'use strict';

const Path = require('path');
const Hoek = require('hoek');
const Joi = require('joi');
const Waterline = require('waterline');
const Schema = require('./schema');
const Package = require('../package.json');

const internals = {};

exports.register = function (server, options, next) {

    Joi.assert(options, Schema.plugin, 'Bad plugin options passed to dogwater.');

    const rootState = internals.state(server.root);

    if (!rootState.setup) {

        const collector = {
            adapters: {},
            connections: {},
            models: {},
            defaults: options.defaults || {}
        };

        // Here's the ORM!
        server.decorate('server', 'waterline', new Waterline());
        server.decorate('server', 'dogwater', internals.dogwater(collector));
        server.decorate('request', 'collections', internals.reqCollections);
        server.ext('onPreStart', internals.initialize(collector));
        server.ext('onPostStop', internals.stop);

        rootState.setup = true;
    };

    const config = internals.registrationConfig(options);
    server.root.dogwater(config);

    next();
};

exports.register.attributes = {
    pkg: Package,
    multiple: true
};

// Massage registration config for use with rejoice
internals.registrationConfig = (options) => {

    const config = Hoek.shallow(options);
    delete config.defaults;

    // Resolve models

    if (typeof config.models === 'string') {
        if (Path.isAbsolute(config.models)) {
            config.models = require(config.models);
        }
        else {
            config.models = require(Path.resolve(process.cwd(), config.models));
        }
    }

    // Resolve adapters

    Object.keys(config.adapters || {}).forEach((name) => {

        if (typeof config.adapters[name] === 'string') {
            config.adapters[name] = require(config.adapters[name]);
        }
    });

    return config;
};

internals.initialize = (collector) => {

    return function (server, next) {

        const waterline = server.waterline;

        // Hand the models to waterline
        Object.keys(collector.models).forEach((id) => {

            const model = collector.models[id];
            const modelExtended = Waterline.Collection.extend(model);
            waterline.loadCollection(modelExtended);
        });

        const config = {
            adapters: collector.adapters,
            connections: collector.connections,
            defaults: collector.defaults
        };

        // Finally init waterline and carry on
        waterline.initialize(config, next);
    };
};

internals.stop = function (server, next) {

    return server.waterline.teardown(next);
};

internals.dogwater = (collector) => {

    return function (config) {

        config = Joi.attempt(config, Schema.dogwater);

        // Array of models, coerce to config
        if (Array.isArray(config)) {
            config = { models: config };
        }

        // Apply empty defaults
        config.adapters = config.adapters || {};
        config.connections = config.connections || {};
        config.models = config.models || [];

        // Collect adapters, connections, models, ensuring no dupes

        const adapterNames = Object.keys(config.adapters);
        const connectionNames = Object.keys(config.connections);
        const modelIds = config.models.map((model) => model.identity);

        adapterNames.forEach((name) => {

            Hoek.assert(!collector.adapters[name], `Adapter "${name}" has already been registered.`);
            collector.adapters[name] = config.adapters[name];
        });

        connectionNames.forEach((name) => {

            Hoek.assert(!collector.connections[name], `Connection "${name}" has already been registered.`);
            collector.connections[name] = config.connections[name];
        });

        modelIds.forEach((id, index) => {

            Hoek.assert(!collector.models[id], `Model definition with identity "${id}" has already been registered.`);
            collector.models[id] = config.models[index];
        });

        // If all went well, track which models belong to which realms
        const state = internals.state(this);
        state.models = (state.models || []).concat(modelIds);
    };
};

internals.reqCollections = function (all) {

    const waterline = this.server.waterline;

    if (!waterline) {
        return {};
    }

    if (all) {
        return waterline.collections;
    }

    const collections = {};
    const models = Hoek.reach(this, 'route.realm.plugins.dogwater.models') || [];

    for (let i = 0; i < models.length; ++i) {
        collections[models[i]] = waterline.collections[models[i]];
    }

    return collections;
};

internals.state = (srv) => {

    const state = srv.realm.plugins.dogwater = srv.realm.plugins.dogwater || {};

    return state;
};
