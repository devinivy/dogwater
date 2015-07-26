var Waterline = require('waterline');
var WaterlineFixtures = require('waterline-fixtures');

exports.register = function (server, options, next) {

    // Models come in as an array or a path to be required
    var models;
    if (options.models instanceof Array) {
        models = options.models;
    } else if (typeof options.models === 'string') {
        models = require(options.models);
    } else {
        next(new Error('The models need to be specified as an array or path to be required.'));
        return;
    }

    // Here's the ORM!
    var waterline = new Waterline();

    // Give the models to waterline
    var modelDef;
    for (var i = 0; i < models.length; i++) {

        modelDef = models[i];

        // If the provided model info is a function, it wants waterline passed to it.
        // This is used for lifecycle callbacks to have access to collections, etc.
        if (typeof modelDef === 'function') {
            modelDef = modelDef(waterline);
        }

        waterline.loadCollection(
            Waterline.Collection.extend(modelDef)
        );
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
    }, function (err, model) {

        if (err) {

            return next(err);
        }

        // Expose collections to server
        server.expose(model.collections);

        // Expose collections to requests so they can be used in handlers easily
        server.ext('onPreHandler', function (modelCollections) {

            return function (request, reply) {

                request.model = modelCollections;
                if (parseInt(server.version) >= 8) {
                    reply.continue();
                } else {
                    reply();
                }
            };
        }(model.collections));

        // Allow servers to access the raw ORM!
        server.method('getWaterline', function (orm) {

            return function (cb) {

                return cb(null, orm);
            };
        }(waterline));

        // Are there fixtures?
        if (options.data) {

            // Load fixtures then have dogwater
            options.data.collections = model.collections;
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
