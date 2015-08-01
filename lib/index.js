var Hoek = require('hoek');
var Items = require('items');
var Waterline = require('waterline');
var WaterlineFixtures = require('waterline-fixtures');

exports.register = function (server, options, next) {

    // Models come in as an array or a path to be required
    Hoek.assert(Array.isArray(options.models) || typeof options.models === 'string',
                'Model definitions need to be specified as an array or path to be required.');

    var models;
    if (Array.isArray(options.models)) {

        models = options.models;
    }

    if (typeof options.models === 'string') {

        models = require(options.models);
    }

    // Here's the ORM!
    var waterline = new Waterline();

    // Give the models to waterline
    var modelDef;
    var modelExtended;
    for (var i = 0; i < models.length; i++) {

        modelDef = models[i];

        // If the provided model info is a function, it wants waterline passed to it.
        // This is used for lifecycle callbacks to have access to collections, etc.
        if (typeof modelDef === 'function') {

            modelDef = modelDef(waterline);
        }

        modelExtended = Waterline.Collection.extend(modelDef);

        waterline.loadCollection(modelExtended);
    }

    // Require the adapters modules if strings are passed instead of objects
    var keys = Object.keys(options.adapters);
    for (var j = 0; j < keys.length; j++) {

        if (typeof options.adapters[keys[j]] === 'string') {

            options.adapters[keys[j]] = require(options.adapters[keys[j]]);
        }

    }

    // Now init using the proper config and expose the model to Hapi
    waterline.initialize({
        connections: options.connections,
        adapters: options.adapters
    }, function (err, ontology) {

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

        // Expose a connection teardown method
        server.expose('teardown', function (cb) {

            var teardowns = {};

            var connection;
            var identity;
            var connectionNames = Object.keys(ontology.connections);
            for (var k = 0; k < connectionNames.length; ++k) {

                connection = ontology.connections[connectionNames[k]];
                identity = connection._adapter.identity;
                if (identity) {

                    teardowns[identity] = teardowns[identity] || connection._adapter.teardown;

                    if (typeof teardowns[identity] !== 'function') {
                        delete teardowns[identity];
                    }

                }
            }

            Items.parallel.execute(teardowns, cb);

        });

        // Are there fixtures?
        if (options.data) {

            // Load fixtures then have dogwater
            options.data.collections = ontology.collections;

            WaterlineFixtures.init(options.data, next);
        } else {

            // Have dogwater
            next();
        }

    });

};

exports.register.attributes = {
    pkg: require('../package.json')
};
