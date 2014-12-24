// Load modules
var Lab = require('lab');
var Hapi = require('hapi');
var Path = require('path');
var Waterline = require('waterline');

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
    
    var dummyAdapters = { foo: {} };
    
    var failureAdapters = 666;

    // Pass adapters as string
    var stringsAdapters = { foo : 'sails-disk' };
    
    // Setup adapters for testing fixtures.
    var fixtureAdapters = { foo: require('sails-memory') };

    var modelsFile   = './models.definition.js';
    var fixturesFile = './models.fixtures.json';
    
    // Setup Hapi server to register the plugin
    beforeEach(function(done){
        server = new Hapi.Server();
        done();
    });
    
    test('takes its models option as a path.', function (done) {
        
        var options = {
            connections: connections,
            adapters: dummyAdapters,
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

    test('takes its adapters option as a string.', function (done) {
        
        var options = {
            connections: connections,
            adapters: stringsAdapters,
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
            adapters: dummyAdapters,
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
            adapters: dummyAdapters,
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
    
    
    test('exposes Waterline collections to server.', function (done) {
        // Via model definitions, this verifies that a definition can be a function
        // to which waterline is passed and from which a definition is returned.
        
        var options = {
            connections: connections,
            adapters: dummyAdapters,
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
    
    test('exposes Waterline collections to request.', function (done) {
        
        var options = {
            connections: connections,
            adapters: dummyAdapters,
            models: require(modelsFile)
        };

        var plugin = {
           plugin: require('..'),
           options: options
        };
        
        server.pack.register(plugin, function (err) {
            
            expect(err).not.to.exist;
            
            server.route({
                path: "/",
                method: "GET",
                handler: function(request, reply) {
                    
                    var dogwater = request.model;
                    
                    expect(dogwater.bar).to.be.an('object');
                    expect(dogwater.zoo).to.be.an('object');
                    
                    reply({});
                }
            });
            
            server.inject({url: "/", method: "GET"}, function(response) {
                done();
            });
            
        });
    });
    
    test('loads fixtures using waterline-fixtures.', function (done) {
        
        var options = {
            connections: connections,
            adapters: fixtureAdapters,
            models: require(modelsFile),
            data: {
                fixtures: require(fixturesFile)
            }
        };

        var plugin = {
           plugin: require('..'),
           options: options
        };
        
        server.pack.register(plugin, function (err) {
            
            expect(err).to.not.exist;
            
            var dogwater = server.plugins.dogwater;
            
            dogwater.bar.find()
            .then(function(bars) {
                
                dogwater.zoo.find()
                .then(function (zoos) {
                    
                    expect(bars).to.have.length(2);
                    expect(zoos).to.have.length(1);
                    
                    done();
                    
                });
                
            });
            
        });
    });
    
    test('exposes waterline through a server method.', function (done) {
        
        var options = {
            connections: connections,
            adapters: dummyAdapters,
            models: require(modelsFile)
        };

        var plugin = {
           plugin: require('..'),
           options: options
        };
        
        server.pack.register(plugin, function (err) {
            
            expect(err).to.not.exist;
            
            server.methods.getWaterline(function(err, waterline) {
                expect(waterline).to.be.instanceof(Waterline);
                done();
            });
            
        });
    });
    
});