module.exports = [
    {
        identity: 'bar',
        connection: 'my_foo',
        
        attributes: {
            foo: 'string'
        }
    },
    
    function(waterline) { // Can pass waterline to model definition
        return {
            identity: 'zoo',
            connection: 'my_foo',
            
            attributes: {
                ding: 'float'
            }
        }
    }
];