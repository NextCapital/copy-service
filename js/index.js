const Formatting = require('./copy-service/Formatting/Formatting');
const Functional = require('./copy-service/Functional/Functional');
const Newline = require('./copy-service/Newline/Newline');
const Reference = require('./copy-service/Reference/Reference');
const RefSubstitute = require('./copy-service/RefSubstitute/RefSubstitute');
const Substitute = require('./copy-service/Substitute/Substitute');
const Switch = require('./copy-service/Switch/Switch');
const Verbatim = require('./copy-service/Verbatim/Verbatim');

const Evaluator = require('./copy-service/Evaluator/Evaluator');
const Substitutions = require('./copy-service/Substitutions/Substitutions');

const ErrorHandler = require('./copy-service/ErrorHandler/ErrorHandler');
const CopyService = require('./copy-service/CopyService');
const IntlCopyService = require('./copy-service/IntlCopyService');

module.exports = {
  Formatting,
  Functional,
  Newline,
  Reference,
  RefSubstitute,
  Substitute,
  Switch,
  Verbatim,

  Evaluator,
  Substitutions,

  ErrorHandler,
  CopyService,
  IntlCopyService
};
