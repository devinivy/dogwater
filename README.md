![dogwater](http://i.imgur.com/FPjWX9s.png)

A [hapi](https://github.com/hapijs/hapi) plugin integrating [Waterline ORM](https://github.com/balderdashy/waterline).

[![Build Status](https://travis-ci.org/devinivy/dogwater.svg?branch=master)](https://travis-ci.org/devinivy/dogwater) [![Coverage Status](http://coveralls.io/repos/devinivy/dogwater/badge.svg?branch=master&service=github)](http://coveralls.io/github/devinivy/dogwater?branch=master)
---

Dogwater takes four options:
* `connections` (required)
  * A [Waterline connections configuration](http://sailsjs.org/#!/documentation/reference/sails.config/sails.config.connections.html)
* `adapters` (required)
  * An object whose keys are adapter names (to be referenced in the `connections` option), and whose values are [Waterline adapter modules](https://github.com/balderdashy/sails-docs/blob/0.9/Database-Support.md)
* `models` (required)
  * Either a path to be `require`d that will return an array of [unextended Waterline collections](https://github.com/balderdashy/waterline-docs/blob/master/models.md#how-do-i-define-a-model) or,
  * An array of unextended Waterline collections
  
  If a function is an element of this array, it will be called with the raw Waterline ORM object as an argument.  It is expected to return an unextended Waterline collection.  This allows one to reference Waterline in lifecycle callbacks.
  
* `data`
  * An object containing the configuration used by [waterline-fixtures](https://github.com/devinivy/waterline-fixtures) to load data fixtures, with the exception of the `collections` option

Dogwater then exposes the collections to `Server.plugins.dogwater` via [Plugin.expose](http://hapijs.com/api#pluginexposeobj) and also to `Request.model`.
The raw Waterline ORM object can be reteived from `Server.methods.getWaterline()` (asynchronously) on all servers to which this plugin has been registered.

Example of usage in a hapi route handler:
```
server.route({
    method: 'GET',
    path: '/monkeys',
    handler: function (request, reply) {
    
        var Monkeys = request.model.monkeys;
        
        Monkeys.find().then(function(monkeys) {
            reply(monkeys);
        });
        
    }
});
```

or equivalently,
 
```
var Monkeys = server.plugins.dogwater.monkeys;

server.route({
    method: 'GET',
    path: '/monkeys',
    handler: function (request, reply) {
        
        Monkeys.find().then(function(monkeys) {
            reply(monkeys);
        });
        
    }
});
```
