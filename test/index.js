// Load modules
var Lab = require('lab');
var Hapi = require('hapi');
var Path = require('path');

// Test shortcuts
var lab = exports.lab = Lab.script();
var expect = Lab.expect;
var beforeEach = lab.beforeEach;
var experiment = lab.experiment;
var test = lab.test;


experiment('Dogwater', function () {
    
    // This will be a Hapi server for each test.
    var server;
    
    // Setup dummy connections/adapters.
    var connections = {
        'my_foo': {
            adapter: 'foo'
        }
    };
    
    var adapters = { foo: {} };
    
    // Setup Hapi server to register the plugin
    beforeEach(function(done){
        server = new Hapi.Server();
        done();
    });

    var modelsFile = './models.data.js';
    
    test('takes its models option as a path.', function (done) {
        
        var options = {
            connections: connections,
            adapters: adapters,
            models: Path.normalize(__dirname + '/' + modelsFile)
        };

        var plugin = {
           plugin: require('..'),
           options: options
        };
        
        
        server.pack.register(plugin, function (err) {
            
            expect(err).to.not.exist;
            
            done();
        });
    });
    
    test('takes its models option as an array.', function (done) {
        
        var options = {
            connections: connections,
            adapters: adapters,
            models: require(modelsFile)
        };

        var plugin = {
           plugin: require('..'),
           options: options
        };
        
        
        server.pack.register(plugin, function (err) {
            
            expect(err).to.not.exist;
            
            done();
        });
    });
    
    test('errors if the models option is not an array or string.', function (done) {
        
        var options = {
            connections: connections,
            adapters: adapters,
            models: {some: 'object'}
        };

        var plugin = {
           plugin: require('..'),
           options: options
        };
        
        server.pack.register(plugin, function (err) {
            
            expect(err).to.exist;
            
            done();
        });
    });
    
    test('exposes Waterline collections.', function (done) {
        
        var options = {
            connections: connections,
            adapters: adapters,
            models: require(modelsFile)
        };

        var plugin = {
           plugin: require('..'),
           options: options
        };
        
        server.pack.register(plugin, function (err) {
            
            var dogwater = server.plugins.dogwater;
            
            expect(err).not.to.exist;
            expect(dogwater.bar).to.be.an('object');
            expect(dogwater.zoo).to.be.an('object');
            
            done();
        });
    });
    
});