'use strict';

const Path = require('path');
const Hoek = require('hoek');
const Waterline = require('waterline');

const internals = {};

exports.register = function (server, options, next) {

    server.decorate('server', 'waterline', new Waterline());
    server.decorate('server', 'registerModels', internals.registerModels);

    server.ext('onPreStart', internals.initialize);
    server.ext('onPostStop', internals.stop);

    next();
};

exports.register.attributes = {
    pkg: require('../package.json')
};

internals.initialize = function (server, next) {

};

internals.stop = function (server, next) {

    return server.waterline.teardown(next);
};

internals.registerModels = function (models) {

    models = [].concat(models);

    const state = this.realm.plugins.dogwater = this.realm.plugins.dogwater || {};
    state.models = state.models || [];
};
