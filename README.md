dogwater
========

A Hapi plugin for Waterline ORM.

Dogwater takes three options:
* `connections`
  * A [Waterline connections configuration](http://sailsjs.org/#/documentation/reference/sails.config/sails.config.connections.html)
* `adapters`
  * An object whose keys are adapter names (to be referenced in the `connections`), and whose values are [Waterline adapter modules](https://github.com/balderdashy/sails-docs/blob/0.9/Database-Support.md)
* `models`
  * Either a path to be `required` that will return an array of [unextended Waterline models](https://github.com/balderdashy/waterline-docs/blob/master/models.md#how-do-i-define-a-model) or,
  * An array of unextended Waterline models

Dogwater then exposes the collections.  Example of usage in a Hapi route handler:
```
server.route({
    method: 'GET',
    path: '/monkeys',
    handler: function (request, reply) {
    
        var Monkeys = request.server.plugins['dogwater'].monkeys
        
        Monkeys.find().then(function(monkeys) {
            reply(monkeys);
        });
        
    }
});
```
