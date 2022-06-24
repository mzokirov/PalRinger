const Joi = require('joi');

module.exports.loginSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
}).required();

module.exports.signupSchema = Joi.object({
    firstName: Joi.string().required(),
    lastName: Joi.string().required(),
    email: Joi.string().email().required(),
    phone: Joi.number().min(1000000000).max(9999999999).required(),
    password: Joi.string().min(10).required()
}).required();

module.exports.profileSchema = Joi.object({
    phone: Joi.number().min(1000000000).max(9999999999).required(),
    email: Joi.string().email().required(),
});