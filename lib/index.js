var Waterline = require('waterline');

exports.register = function(plugin, options, next) {
    
    // Models come in as an array or a path to be required
    var models;
    if (options.models instanceof Array) {
        models = options.models;
    } else if (typeof options.models === 'string') {
        models = require(options.models);
    } else {
        throw new Error('The models need to be specified as an array or path to be required.');
    }
    
    // Here's the ORM!
    var waterline = new Waterline();
    
    // Give the models to waterline
    for (var i = 0; i < models.length; i++) {
        waterline.loadCollection(
            Waterline.Collection.extend(models[i])
        );
    }
    
    // Now init using the proper config and expose the model to Hapi
    waterline.initialize({
        connections: options.connections,
        adapters: options.adapters
    }, function(err, model) {
        
        plugin.expose(model.collections);
        
        // We have dogwater
        next();
    });
    
}

exports.register.attributes = {
    pkg: require('../package.json')
};
