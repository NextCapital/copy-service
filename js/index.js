const Formatting = require('./copy-service/Formatting/Formatting').default;
const Functional = require('./copy-service/Functional/Functional').default;
const Newline = require('./copy-service/Newline/Newline');
const Reference = require('./copy-service/Reference/Reference').default;
const RefSubstitute = require('./copy-service/RefSubstitute/RefSubstitute').default;
const Substitute = require('./copy-service/Substitute/Substitute').default;
const Switch = require('./copy-service/Switch/Switch').default;
const Verbatim = require('./copy-service/Verbatim/Verbatim').default;
const WordBreak = require('./copy-service/WordBreak/WordBreak').default;

const Evaluator = require('./copy-service/Evaluator/Evaluator');
const Substitutions = require('./copy-service/Substitutions/Substitutions').default;

const ErrorHandler = require('./copy-service/ErrorHandler/ErrorHandler').default;
const CopyService = require('./copy-service/CopyService');
const IntlCopyService = require('./copy-service/IntlCopyService');

const PlainTextEvaluator = require('./plain-text-evaluator/PlainTextEvaluator');
const HtmlEvaluator = require('./html-evaluator/HtmlEvaluator');
const ReactEvaluator = require('./react-evaluator/ReactEvaluator');

module.exports = {
  Formatting,
  Functional,
  Newline,
  Reference,
  RefSubstitute,
  Substitute,
  Switch,
  Verbatim,
  WordBreak,

  Evaluator,
  Substitutions,

  ErrorHandler,
  CopyService,
  IntlCopyService,

  PlainTextEvaluator,
  HtmlEvaluator,
  ReactEvaluator
};
