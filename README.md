![dogwater](http://i.imgur.com/FPjWX9s.png)

A [hapi](https://github.com/hapijs/hapi) plugin integrating [Waterline ORM](https://github.com/balderdashy/waterline)

[![Build Status](https://travis-ci.org/devinivy/dogwater.svg?branch=master)](https://travis-ci.org/devinivy/dogwater) [![Coverage Status](http://coveralls.io/repos/devinivy/dogwater/badge.svg?branch=master&service=github)](http://coveralls.io/github/devinivy/dogwater?branch=master)

[*v1.0.0 release notes*](https://github.com/devinivy/dogwater/issues/25)

## Usage
```node
var Hapi = require('hapi');
var Dogwater = require('dogwater');
var Memory = require('sails-memory');

var server = new Hapi.Server();
server.connection({ port: 3000 });

server.route({
    method: 'GET',
    path: '/dogs/{id}',
    handler: function (request, reply) {

        var Dogs = request.collections.dogs;

        // Reply with promise
        reply(Dogs.findOne(request.params.id));
    }
});

server.register({
    register: Dogwater,
    options: {
        adapters: {
            memory: Memory
        },
        connections: {
            simple: { adapter: 'memory' },
        },
        models: [
            {
                identity: 'dogs',
                connection: 'simple',
                attributes: { name: 'string' }
            }
        ],
        fixtures: [
            {
                model: 'dogs',
                items: [
                    { name: 'Guinness' },
                    { name: 'Sully' },
                    { name: 'Ren' }
                ]
            }
        ],
    }
}, function (err) {

    if (err) {
        throw err;
    }

    server.start(function () {

       console.log('Server running at:', server.info.uri);
    });
});
```
### Interface
#### Server
 - `server.waterline` - the raw Waterline ORM object.

#### Request
 - `request.collections` - an object containing all Waterline collections indexed by identity.

#### Exposed
 - `server.plugins.dogwater.collections` - an object containing all Waterline collections indexed by identity.
 - `server.plugins.dogwater.connections` - an object containing all Waterline connections indexed by name.
 - `server.plugins.dogwater.schema` - an object containing the normalized Waterline schema.
 - `server.plugins.dogwater.teardown(cb)` - a method to teardown all Waterline-managed connections, `cb` taking a single error argument.

### Options
 - `adapters` - An object whose keys are adapter names (to be referenced in the `connections` option), and whose values are [Waterline adapter modules](https://github.com/balderdashy/waterline-docs/blob/master/README.md#supported-adapters) or string names of adapter modules to be `require`d.
 - `connections` - An object containing a [Waterline connections configuration](http://sailsjs.org/#!/documentation/reference/sails.config/sails.config.connections.html).  Each key should be a connection name, and each value should be an object specifying the relevant adapter's name plus any adapter connection configurations.
 - `models` - Either a relative (to the current working directory) or absolute path to be `require`d that will return an array of [unextended Waterline collections](https://github.com/balderdashy/waterline-docs/blob/master/models/models.md#how-to-define-a-model), or an array of unextended Waterline collections.  If a function is an element of this array, it will be called with the raw Waterline ORM object as an argument.  It is expected to return an unextended Waterline collection.  This allows one to easily reference Waterline in lifecycle callbacks.
 - `defaults` - An optional object containing Waterline collection default settings.  This is a standard Waterline initialization option.
 - `fixtures` - An optional object containing the configuration used by [waterline-fixtures](https://github.com/devinivy/waterline-fixtures) to load data fixtures, with the exception of its `collections` option, which is automatically set by dogwater.  Alternately, this option may specify an array of fixture data in the format prescribed by waterline-fixtures (which can be seen in the usage example above).

Dogwater's options aim to be friendly with [rejoice](https://github.com/hapijs/rejoice) manifests.

## Extras
 - [Waterline ORM docs](https://github.com/balderdashy/waterline-docs)
 - [devinivy/waterline-fixtures](https://github.com/devinivy/waterline-fixtures)
 - [devinivy/bedwetter](https://github.com/devinivy/bedwetter)
 - [hapijs/rejoice](https://github.com/hapijs/rejoice)
