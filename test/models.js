'use strict';

module.exports = [
    {
        identity: 'thismodel',
        connection: 'myConnection',
        migrate: 'create',
        attributes: {
            doo: 'string'
        }
    },
    {
        identity: 'thatmodel',
        connection: 'myConnection',
        attributes: {
            ding: 'float'
        }
    }
];
