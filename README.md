![dogwater](http://i.imgur.com/FPjWX9s.png)

A [hapi](https://github.com/hapijs/hapi) plugin integrating [Waterline ORM](https://github.com/balderdashy/waterline)

[![Build Status](https://travis-ci.org/devinivy/dogwater.svg?branch=master)](https://travis-ci.org/devinivy/dogwater) [![Coverage Status](http://coveralls.io/repos/devinivy/dogwater/badge.svg?branch=master&service=github)](http://coveralls.io/github/devinivy/dogwater?branch=master)

[*v1.0.0 release notes*](https://github.com/devinivy/dogwater/issues/25)

## Usage
```js
const Hapi = require('hapi');
const Dogwater = require('dogwater');
const Memory = require('sails-memory');

const server = new Hapi.Server();
server.connection({ port: 3000 });

server.route({
    method: 'get',
    path: '/dogs/{id}',
    handler: function (request, reply) {

        const Dogs = request.collections().dogs;

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
            simple: { adapter: 'memory' }
        }
    }
}, function (err) {

    if (err) {
        throw err;
    }

    // Define a model using a connection declared above
    server.dogwater({
        identity: 'dogs',
        connection: 'simple',
        attributes: { name: 'string' }
    });

    server.start(function (err) {

        if (err) {
            throw err;
        }

        // Add some records

        const Dogs = server.collections().dogs;

        Dogs.create([
            { name: 'Guinness' },
            { name: 'Sully' },
            { name: 'Ren' }
        ])
        .then(() => {

            console.log(`Go find some dogs at ${server.info.uri}`);
        });
        .catch((err) => {

            console.error(err);
        });
    });
});
```

### API
#### Server
 - `server.waterline` - the raw Waterline ORM object.
 - `server.collections([all])`
 - `server.dogwater(config)`

#### Request
 - `request.collections([all])`

### Registration Options
 - `adapters` - An object whose keys are adapter names (to be referenced in the `connections` option), and whose values are [Waterline adapter modules](https://github.com/balderdashy/waterline-docs/blob/master/README.md#supported-adapters) or string names of adapter modules to be `require`d.
 - `connections` - An object containing a [Waterline connections configuration](http://sailsjs.org/#!/documentation/reference/sails.config/sails.config.connections.html).  Each key should be a connection name, and each value should be an object specifying the relevant adapter's name plus any adapter connection configurations.
 - `models` - Either a relative (to the current working directory) or absolute path to be `require`d that will return an array of [unextended Waterline collections](https://github.com/balderdashy/waterline-docs/blob/master/models/models.md#how-to-define-a-model), or an array of unextended Waterline collections.
 - `defaults` - An optional object containing Waterline collection default settings.  This is a standard Waterline initialization option.
 - `teardownOnStop`

Dogwater's registration options aim to be friendly with [rejoice](https://github.com/hapijs/rejoice) manifests.

## Extras
 - [Waterline ORM docs](https://github.com/balderdashy/waterline-docs)
 - [hapijs/rejoice](https://github.com/hapijs/rejoice)
