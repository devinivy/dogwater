![dogwater](http://i.imgur.com/bfMM0Cy.png)

A [Hapi](https://github.com/hapijs/hapi) plugin for [Waterline ORM](https://github.com/balderdashy/waterline).

---

Dogwater takes three options, all of which are essentially necessary:
* `connections`
  * A [Waterline connections configuration](http://sailsjs.org/#/documentation/reference/sails.config/sails.config.connections.html)
* `adapters`
  * An object whose keys are adapter names (to be referenced in the `connections` option), and whose values are [Waterline adapter modules](https://github.com/balderdashy/sails-docs/blob/0.9/Database-Support.md)
* `models`
  * Either a path to be `require`d that will return an array of [unextended Waterline collections](https://github.com/balderdashy/waterline-docs/blob/master/models.md#how-do-i-define-a-model) or,
  * An array of unextended Waterline collections

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
