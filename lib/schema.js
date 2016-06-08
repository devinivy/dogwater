'use strict';

const Joi = require('joi');

const internals = {};

internals.configBase = Joi.object({
    adapters: Joi.object(),
    connections: Joi.object()
});

internals.model = Joi.object({
    identity: Joi.string().required()
}).unknown();

exports.plugin = internals.configBase.keys({
    models: [
        Joi.string(),
        Joi.array().items(Joi.object())
    ],
    defaults: Joi.object()
});

exports.registerModels = Joi.alternatives([
    Joi.array().items(internals.model).single(),
    internals.configBase.keys({
        models: Joi.array().items(internals.model).single()
    })
]);
