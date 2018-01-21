![dogwater](http://i.imgur.com/FPjWX9s.png)

A [hapi](https://github.com/hapijs/hapi) plugin integrating [Waterline ORM](https://github.com/balderdashy/waterline)

[![Build Status](https://travis-ci.org/devinivy/dogwater.svg?branch=master)](https://travis-ci.org/devinivy/dogwater) [![Coverage Status](http://coveralls.io/repos/devinivy/dogwater/badge.svg?branch=master&service=github)](http://coveralls.io/github/devinivy/dogwater?branch=master)

### *If you are looking for an up to date hapi plugin for waterline, see https://github.com/tswayne/hapi-water

[*v2.0.0 release notes*](https://github.com/devinivy/dogwater/issues/46)

## Usage
Dogwater is used to define models, database adapters, and connections for use with Waterline ORM.  Those models then become available as Waterline collections within your hapi server where it is most convenient.  It has been tailored to multi-plugin deployments, where each plugin may set clear boundaries in defining and using its own collections.  It's safe to register dogwater multiple times, wherever you'd like to use it, as it protects against collisions in adapters, connections, model definitions, and more.

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
}, (err) => {

    if (err) {
        throw err;
    }

    // Define a model using a connection declared above
    server.dogwater({
        identity: 'dogs',
        connection: 'simple',
        attributes: { name: 'string' }
    });

    server.start((err) => {

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
        })
        .catch((err) => {

            console.error(err);
        });
    });
});
```

## API
### Registration
Dogwater may be registered multiple times– it should be registered in any plugin that would like to use any of its features.  It's suggested that registration options only be passed when dogwater is registered outside of a plugin (on the root server), and that within plugins [`server.dogwater()`](#serverdogwaterconfig) be used instead, at least for defining models.  Upon each registration these options are collected until server initialization.  The same adapter, connection, model, or default value may not be specified more than once. Dogwater takes the following registration options,

  - `adapters` - an object whose keys are adapter names (to be referenced by a connection config), and whose values are [Waterline adapter modules](https://github.com/balderdashy/waterline-docs/blob/master/README.md#supported-adapters) or string names of adapter modules to be `require`d.
  - `connections` - an object containing a [Waterline connections configuration](http://sailsjs.org/#!/documentation/reference/sails.config/sails.config.connections.html).  Each key should be a connection name, and each value should be an object specifying the relevant adapter's name plus any adapter connection configurations.
  - `models` - either a relative (to the current working directory) or absolute path to be `require`d that will return an array of model definitions (also known as [unextended Waterline collections](https://github.com/balderdashy/waterline-docs/blob/master/models/models.md#how-to-define-a-model)) or a single model definition.  May also be an actual array of model definitions.  Any models registered this way are associated with the root server.
  - `defaults` - an object containing Waterline collection default settings.  This is a standard Waterline initialization option.
  - `teardownOnStop` - a boolean indicating whether or not Waterline connections should be torn-down when the hapi server stops (after server connections are drained).  Defaults to `true`, and may only be specified once.

Dogwater's registration options aim to be friendly with [rejoice](https://github.com/hapijs/rejoice) manifests.

### Server Decorations
#### `server.waterline`
The raw Waterline ORM object, available as soon as dogwater is first registered.  The Waterline instance is initialized during server initialization.

#### `server.collections([all])`
Returns an object mapping collection identities to Waterline collections.  When called before Waterline is initialized, returns an empty object.  When `all` is `true`, every Waterline collection is returned.  Otherwise, only returns those collections registered within the same plugin/realm via `server.dogwater()`.

#### `server.dogwater(config)`
Registers additional adapters, connections, or model definitions.  The `config` may be either,
  - A model definition or an array of definitions.
  - An object specifying,
    - `adapters` - an object whose keys are adapter names (to be referenced by a connection config), and whose values are Waterline adapter modules.
    - `connections` - a Waterline connections configuration.  Each key should be a connection name, and each value should be an object specifying the relevant adapter's name plus any adapter connection configurations.
    - `models` - an array of model definitions.  Any models registered this way are associated with the active plugin/realm.

### Request Decorations
#### `request.collections([all])`
Returns an object mapping collection identities to Waterline collections.  When called before Waterline is initialized, returns an empty object.  When `all` is `true`, every Waterline collection is returned.  Otherwise, only returns those collections registered via `server.dogwater()` within the same plugin/realm as `request.route`.

## Extras
  - [Waterline ORM docs](https://github.com/balderdashy/waterline-docs)
  - [hapijs/rejoice](https://github.com/hapijs/rejoice)
  - Compatible with [haute-couture](https://github.com/devinivy/haute-couture)
  - One of the core plugins of the hapi [boilerplate-api](https://github.com/devinivy/boilerplate-api)
