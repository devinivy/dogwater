var Waterline = require('waterline');
var waterlineFixtures = require('waterline-fixtures');

exports.register = function(server, options, next) {
    
    // Models come in as an array or a path to be required
    var models;
    if (options.models instanceof Array) {
        models = options.models;
    } else if (typeof options.models === 'string') {
        models = require(path.join(process.cwd(), options.models));
    } else {
        next(new Error('The models need to be specified as an array or path to be required.'));
        return;
    }
    
    // Here's the ORM!
    var waterline = new Waterline();
    
    // Give the models to waterline
    var model;
    for (var i = 0; i < models.length; i++) {
        
        model = models[i];
        
        // If the provided model info is a function, it wants waterline passed to it.
        // This is used for lifecycle callbacks to have access to collections, etc.
        if (typeof model === 'function') {
            model = model(waterline);
        }
        
        waterline.loadCollection(
            Waterline.Collection.extend(model)
        );
    }

    // Require the adapters modules if strings are passed instead of objects
    var keys =  Object.keys(options.adapters);
    for (var i = 0; i < keys.length; i++) {

        if (typeof options.adapters[keys[i]] === 'string') {
            options.adapters[keys[i]] = require(options.adapters[keys[i]]);
        }

    }
    
    // Now init using the proper config and expose the model to Hapi
    waterline.initialize({
        connections: options.connections,
        adapters: options.adapters
    }, function(err, model) {
        
        if (err) return next(err);
        
        // Expose collections to server
        server.expose(model.collections);
        
        // Expose collections to requests so they can be used in handlers easily
        server.ext('onPreHandler', function(modelCollections) {
            return function(request, reply) {
                    request.model = modelCollections;
                    if (parseInt(server.version) >= 8) {
                        reply.continue();
                    } else {
                        reply();
                    }
                }
        }(model.collections));

        // Allow servers to access the raw ORM!
        server.method('getWaterline', function(orm) {
            return function(cb) {
                return cb(null, orm);
            }
        }(waterline));
        
        // Are there fixtures?
        if (options.data) {
            
            // Load fixtures then have dogwater
            options.data.collections = model.collections;
            waterlineFixtures.init(options.data, next);
            
        } else {
            
            // Have dogwater
            next();
        }
        
    });
    
}

exports.register.attributes = {
    pkg: require('../package.json')
};
