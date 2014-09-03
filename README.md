![dogwater](http://i.imgur.com/FPjWX9s.png)

A [Hapi](https://github.com/hapijs/hapi) plugin integrating [Waterline ORM](https://github.com/balderdashy/waterline).

---

Dogwater takes four options:
* `connections` (required)
  * A [Waterline connections configuration](http://sailsjs.org/#/documentation/reference/sails.config/sails.config.connections.html)
* `adapters` (required)
  * An object whose keys are adapter names (to be referenced in the `connections` option), and whose values are [Waterline adapter modules](https://github.com/balderdashy/sails-docs/blob/0.9/Database-Support.md)
* `models` (required)
  * Either a path to be `require`d that will return an array of [unextended Waterline collections](https://github.com/balderdashy/waterline-docs/blob/master/models.md#how-do-i-define-a-model) or,
  * An array of unextended Waterline collections
* `data`
  * An object containing the configuration used by [waterline-fixtures](https://github.com/devinivy/waterline-fixtures) to load data fixtures, with the exception of the `collections` option

Dogwater then exposes the collections to `Server.plugins.dogwater` via [Plugin.expose](http://hapijs.com/api#pluginexposeobj) and also to `Request.model`.

Example of usage in a Hapi route handler:
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