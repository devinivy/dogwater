'use strict';

// Can pass waterline to model definition
module.exports = [
    function (waterline) {

        return {
            identity: 'bar',
            connection: 'myFoo',
            migrate: 'create',

            attributes: {
                doo: 'string'
            },

            iHaveWaterline: function () {

                return waterline;
            }
        };
    },
    function (waterline) {

        return {
            identity: 'zoo',
            connection: 'myFoo',

            attributes: {
                ding: 'float'
            },

            iHaveWaterline: function () {

                return waterline;
            }
        };
    }
];
