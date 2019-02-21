import _ from 'lodash';

import ErrorHandler from '../ErrorHandler/ErrorHandler';

class Substitutions {
  constructor(substitutions) {
    this._substitutions = substitutions;
  }

  get substitutions() {
    if (_.isFunction(this._substitutions)) {
      this._substitutions = this._substitutions();
    }

    return this._substitutions;
  }

  get(key) {
    const value = _.get(this.substitutions, key);

    if (_.isUndefined(value)) {
      ErrorHandler.handleError(
        'Substitutions',
        `No value for substitution at key '${key}' provided`
      );

      return '';
    }

    return value;
  }

  getBoolean(key) {
    const value = this.get(key);

    if (_.isNumber(value)) {
      return value === 1; // true if singular
    }

    return Boolean(value);
  }
}

export default Substitutions;
