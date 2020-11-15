'use strict';

const Joi = require('joi');

class KoaJoiValidatorMiddleware {
  constructor(schema, {
    onError = 'validation failed for given schema'
  }) {
    this.schema = schema;
    this.onError = onError;

    this._validateParameters();
  }

  async execute(ctx, next) {
    this.ctx = ctx;
    this.next = next;
    try {
      Joi.attempt(ctx.request.body, this.schema);
      await next();
    } catch (error) {
      this._handleValidationError(error);
    }
  }

  _validateParameters() {
    if (!this.schema) {
      throw new Error('schema parameter is missing');
    }

    const onErrorIsValid = ['string', 'function'].filter(v => v === typeof this.onError).length === 1;
    if (onErrorIsValid === false) {
      throw new Error('onError parameter is invalid');
    }
  }

  _handleValidationError(error) {
    if (error instanceof Joi.ValidationError === false) {
      throw error;
    }
    if (typeof this.onError === 'string') {
      throw new Error(this.onError);
    } else if (typeof this.onError === 'function') {
      this.onError(this.ctx, this.next, error);
    }
  }
}

module.exports = (schema, config = {}) => {
  const instance = new KoaJoiValidatorMiddleware(schema, config);
  return async (ctx, next) => instance.execute(ctx, next);
};
