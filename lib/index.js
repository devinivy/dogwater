'use strict';

const Path = require('path');
const Hoek = require('hoek');
const Waterline = require('waterline');

const internals = {};

exports.register = function (server, options, next) {

    // Models come in as an array or a path to be required
    Hoek.assert(Array.isArray(options.models) || typeof options.models === 'string',
                'Model definitions need to be specified as an array or path to be required.');

    let models;
    if (Array.isArray(options.models)) {

        models = options.models;
    }

    if (typeof options.models === 'string') {

        if (Path.isAbsolute(options.models)) {
            models = require(options.models);
        }
        else {
            models = require(Path.resolve(process.cwd(), options.models));
        }
    }

    // Here's the ORM!
    const waterline = new Waterline();

    // Give the models to waterline
    for (let i = 0; i < models.length; ++i) {

        let modelDef = models[i];

        // If the provided model info is a function, it wants waterline passed to it.
        // This is used for lifecycle callbacks to have access to collections, etc.
        if (typeof modelDef === 'function') {

            modelDef = modelDef(waterline);
        }

        const modelExtended = Waterline.Collection.extend(modelDef);

        waterline.loadCollection(modelExtended);
    }

    // Require the adapters modules if strings are passed instead of objects
    const keys = Object.keys(options.adapters);
    for (let i = 0; i < keys.length; ++i) {

        if (typeof options.adapters[keys[i]] === 'string') {

            options.adapters[keys[i]] = require(options.adapters[keys[i]]);
        }

    }

    options.defaults = options.defaults || {};

    // Now init using the proper config and expose the model to hapi
    waterline.initialize({
        connections: options.connections,
        adapters: options.adapters,
        defaults: options.defaults
    }, (err, ontology) => {

        if (err) {
            return next(err);
        }

        // Expose public objects from the ORM
        server.expose('collections', ontology.collections);
        server.expose('connections', ontology.connections);
        server.expose('schema', waterline.schema);

        // Decorate server with the raw ORM
        server.decorate('server', 'waterline', waterline);

        // Decorate request with collections so they can be used in extensions easily
        server.decorate('request', 'collections', ontology.collections);

        // Expose an all-connections teardown method
        server.expose('teardown', (cb) => server.waterline.teardown(cb));

        // Have dogwater
        next();
    });

};

exports.register.attributes = {
    pkg: require('../package.json')
};
