'use strict';

module.exports = [
    {
        identity: 'bar',
        connection: 'myFoo',
        migrate: 'create',

        attributes: {
            doo: 'string'
        }
    },
    {
        identity: 'zoo',
        connection: 'myFoo',

        attributes: {
            ding: 'float'
        }
    }
];
