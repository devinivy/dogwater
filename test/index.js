// Load modules
var Lab = require('lab');
var Code = require('code');
var Hapi8 = require('hapi');
var Hapi7 = require('hapi-v7');
var Items = require('items');
var Path = require('path');
var Waterline = require('waterline');
var Memory = require('sails-memory');

// Test shortcuts
var lab = exports.lab = Lab.script();
var expect = Code.expect;
var beforeEach = lab.beforeEach;
var experiment = lab.experiment;
var test = lab.test;


experiment('Dogwater', function () {
    
    // This will be a hapi server for each test.
    var server8;
    var server7;
    
    // Setup dummy connections/adapters.
    var connections = {
        'my_foo': {
            adapter: 'foo'
        }
    };
    
    var dummyAdapters = { foo: {} };
    
    var failureAdapters = 666;

    // Pass adapters as string
    var stringsAdapters = { foo : 'sails-memory' };
    
    // Setup adapters for testing fixtures.
    var fixtureAdapters = { foo: Memory };

    var modelsFile   = './models.definition.js';
    var fixturesFile = './models.fixtures.json';
    
    // For use with Items.serial
    var playItem = function(item, done) {
        
        item(done);
    }
    
    // Setup Hapi server to register the plugin
    beforeEach(function(done){
        server8 = new Hapi8.Server();
        server8.connection();
        server7 = new Hapi7.Server();
        done();
    });

    test('takes its models option as a relative path.', function (done) {

        var options = {
            connections: connections,
            adapters: dummyAdapters,
            models: Path.normalize('./test/' + modelsFile)
        };

        var plugin8 = {
           register: require('..'),
           options: options
        };

        var plugin7 = {
           plugin: require('..'),
           options: options
        };

        var theTest = function (server, error, callback) {

            expect(error).to.not.exist();
            callback();
        };

        Items.serial([
            function (cb) {

                server8.register(plugin8, function (err) {

                    theTest(server8, err, cb);
                });
            },
            Memory.teardown,
            function (cb) {

                server7.pack.register(plugin7, function (err) {

                    theTest(server7, err, cb);
                });
            },
            Memory.teardown
        ], playItem, done);

    });
    
    test('takes its models option as an absolute path.', function (done) {
        
        var options = {
            connections: connections,
            adapters: dummyAdapters,
            models: Path.normalize(__dirname + '/' + modelsFile)
        };
        
        var plugin8 = {
           register: require('..'),
           options: options
        };
        
        var plugin7 = {
           plugin: require('..'),
           options: options
        };
        
        var theTest = function (server, error, callback) {
            
            expect(error).to.not.exist();
            callback();
        }
        
        Items.serial([
            function(cb) {
                server8.register(plugin8, function(err) { theTest(server8, err, cb) } );
            },
            Memory.teardown,
            function(cb) {
                server7.pack.register(plugin7, function(err) { theTest(server7, err, cb) } );
            },
            Memory.teardown
        ], playItem, done);
        
    });

    test('takes its adapters option as a string.', function (done) {
        
        var options = {
            connections: connections,
            adapters: stringsAdapters,
            models: Path.normalize(__dirname + '/' + modelsFile)
        };

        var plugin8 = {
           register: require('..'),
           options: options
        };

        var plugin7 = {
           plugin: require('..'),
           options: options
        };
        
        var theTest = function (server, error, callback) {
            
            expect(error).to.not.exist();
            callback();
        }
        
        Items.serial([
            function(cb) {
                server8.register(plugin8, function(err) { theTest(server8, err, cb) } );
            },
            Memory.teardown,
            function(cb) {
                server7.pack.register(plugin7, function(err) { theTest(server7, err, cb) } );
            },
            Memory.teardown
        ], playItem, done);

    });
    
    test('takes its models option as an array.', function (done) {
        
        var options = {
            connections: connections,
            adapters: dummyAdapters,
            models: require(modelsFile)
        };

        var plugin8 = {
           register: require('..'),
           options: options
        };
        
        var plugin7 = {
           plugin: require('..'),
           options: options
        };
        
        var theTest = function (server, error, callback) {
            
            expect(error).to.not.exist();
            callback();
        }
        
        Items.serial([
            function(cb) {
                server8.register(plugin8, function(err) { theTest(server8, err, cb) } );
            },
            Memory.teardown,
            function(cb) {
                server7.pack.register(plugin7, function(err) { theTest(server7, err, cb) } );
            },
            Memory.teardown
        ], playItem, done);
        
    });
    
    test('errors if the models option is not an array or string.', function (done) {
        
        var options = {
            connections: connections,
            adapters: dummyAdapters,
            models: {some: 'object'}
        };
        
        var plugin8 = {
           register: require('..'),
           options: options
        };
        
        var plugin7 = {
           plugin: require('..'),
           options: options
        };
        
        var theTest = function (server, error, callback) {
            
            expect(error).to.exist();
            callback();
        }
        
        Items.serial([
            function(cb) {
                server8.register(plugin8, function(err) { theTest(server8, err, cb) } );
            },
            Memory.teardown,
            function(cb) {
                server7.pack.register(plugin7, function(err) { theTest(server7, err, cb) } );
            },
            Memory.teardown
        ], playItem, done);
        
    });
    
    
    test('exposes Waterline collections to server.', function (done) {
        // Via model definitions, this verifies that a definition can be a function
        // to which waterline is passed and from which a definition is returned.
        
        var options = {
            connections: connections,
            adapters: dummyAdapters,
            models: require(modelsFile)
        };

        var plugin8 = {
           register: require('..'),
           options: options
        };
        
        var plugin7 = {
           plugin: require('..'),
           options: options
        };
        
        var theTest = function (server, error, callback) {
            
            var dogwater = server.plugins.dogwater;
            
            expect(error).not.to.exist();
            expect(dogwater.bar).to.be.an.object();
            expect(dogwater.zoo).to.be.an.object();
            
            callback();
        }
        
        Items.serial([
            function(cb) {
                server8.register(plugin8, function(err) { theTest(server8, err, cb) } );
            },
            Memory.teardown,
            function(cb) {
                server7.pack.register(plugin7, function(err) { theTest(server7, err, cb) } );
            },
            Memory.teardown
        ], playItem, done);
        
    });
    
    test('exposes Waterline collections to request.', function (done) {
        
        var options = {
            connections: connections,
            adapters: dummyAdapters,
            models: require(modelsFile)
        };

        var plugin8 = {
           register: require('..'),
           options: options
        };
        
        var plugin7 = {
           plugin: require('..'),
           options: options
        };
        
        var theTest = function (server, error, callback) {
            
            expect(error).not.to.exist();
            
            server.route({
                path: "/",
                method: "GET",
                handler: function(request, reply) {
                    
                    var dogwater = request.model;
                    
                    expect(dogwater.bar).to.be.an.object();
                    expect(dogwater.zoo).to.be.an.object();
                    
                    reply({});
                }
            });
            
            server.inject({url: "/", method: "GET"}, function(response) {
                callback();
            });
        }
        
        Items.serial([
            function(cb) {
                server8.register(plugin8, function(err) { theTest(server8, err, cb) } );
            },
            Memory.teardown,
            function(cb) {
                server7.pack.register(plugin7, function(err) { theTest(server7, err, cb) } );
            },
            Memory.teardown
        ], playItem, done);
        
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
        
        var plugin8 = {
           register: require('..'),
           options: options
        };
        
        var plugin7 = {
           plugin: require('..'),
           options: options
        };
        
        var theTest = function (server, error, callback) {
            
            expect(error).to.not.exist();
            
            var dogwater = server.plugins.dogwater;
            
            dogwater.bar.find()
            .then(function(bars) {
                
                dogwater.zoo.find()
                .then(function (zoos) {
                    
                    expect(bars).to.have.length(2);
                    expect(zoos).to.have.length(1);
                    
                    callback();
                    
                });
                
            });
            
        }
        
        Items.serial([
            function(cb) {
                server8.register(plugin8, function(err) { theTest(server8, err, cb) } );
            },
            Memory.teardown,
            function(cb) {
                server7.pack.register(plugin7, function(err) { theTest(server7, err, cb) } );
            },
            Memory.teardown
        ], playItem, done);
        
    });
    
    test('exposes waterline through a server method.', function (done) {
        
        var options = {
            connections: connections,
            adapters: dummyAdapters,
            models: require(modelsFile)
        };
        
        var plugin8 = {
           register: require('..'),
           options: options
        };
        
        var plugin7 = {
           plugin: require('..'),
           options: options
        };
        
        var theTest = function (server, error, callback) {
            
            expect(error).to.not.exist();
            
            server.methods.getWaterline(function(err, waterline) {
                expect(waterline).to.be.instanceof(Waterline);
                callback();
            });
            
        }
        
        Items.serial([
            function(cb) {
                server8.register(plugin8, function(err) { theTest(server8, err, cb) } );
            },
            Memory.teardown,
            function(cb) {
                server7.pack.register(plugin7, function(err) { theTest(server7, err, cb) } );
            },
            Memory.teardown
        ], playItem, done);
        
    });

    test('errors on fail.', function (done) {
        
        var options = {
            connections: connections,
            adapters: fixtureAdapters,
            models: require(modelsFile)
        };
        
        var plugin8 = {
           register: require('..'),
           options: options
        };
        
        var plugin7 = {
           plugin: require('..'),
           options: options
        };
        
        server8.register(plugin8, function(err) {
            
            expect(err).to.not.exist();
            
            // Fail by reusing adapter
            server7.pack.register(plugin7, function(err) {
                expect(err).to.exist();
                done();
            });
            
        });
        
    });
    
});
