const _ = require('lodash');

const SyntaxNode = require('../SyntaxNode/SyntaxNode').default;
const Formatting = require('../Formatting/Formatting').default;
const Functional = require('../Functional/Functional').default;
const Newline = require('../Newline/Newline');
const Reference = require('../Reference/Reference');
const RefSubstitute = require('../RefSubstitute/RefSubstitute').default;
const Substitute = require('../Substitute/Substitute').default;
const Switch = require('../Switch/Switch').default;
const Verbatim = require('../Verbatim/Verbatim').default;
const WordBreak = require('../WordBreak/WordBreak').default;

const ErrorHandler = require('../ErrorHandler/ErrorHandler').default;

/**
 * The supported tokens in copy.
 *
 * @type {object}
 */
const TOKENS = {
  TEXT: 'text',
  SWITCH_DELIM: '}{',
  CLOSE: '}',
  REF_START: '${',
  SUB_START: '\#{', // eslint-disable-line no-useless-escape
  REF_SUB_START: '%{',
  SWITCH_START: '*{',
  FUNC_START: '^{',
  HTML_TAG_START: '<',
  HTML_TAG_END: '>',
  ARGS_START: '}[',
  ARGS_COMMA: ',',
  ARGS_END: ']',
  NEWLINE: '\n',
  WORD_BREAK: '\b'
};

/**
 * All TOKENS that are not TEXT, TAG, or ARGS tokens.
 *
 * @type {Array}
 */
const NON_TEXT_TOKENS = _.filter(_.values(TOKENS), (token) => (
  !_.includes([
    TOKENS.TEXT,
    TOKENS.HTML_TAG_START,
    TOKENS.HTML_TAG_END,
    TOKENS.ARGS_START,
    TOKENS.ARGS_COMMA,
    TOKENS.ARGS_END
  ], token)
));

/**
 * RegExp for the starting tag of allowed HTML tags.
 *
 * @type {RegExp}
 */
const HTML_START_TAG_REGEX = /^<(\w+)>/;

/**
 * RegExp for the ending tag of allowed HTML tags.
 *
 * @type {RegExp}
 */
const HTML_END_TAG_REGEX = /^<\/(\w+)>/;

/**
 * The supported HTML tags in copy.
 *
 * @type {Array}
 */
const ALLOWED_HTML_TAGS = [
  // cspell:disable-next-line
  'u', 'sup', 'sub', 's', 'em', 'strong', 'p', 'span', 'div', 'ol', 'ul', 'li', 'b', 'i', 'u'
];

/**
 * The supported delimiter for subkeys.
 *
 * @type {string}
 */
const KEY_DELIMITER = '.';

/**
 * Parses raw json copy into ASTs.
 */
class Parser {
  /**
   * Transforms raw copy into ASTs. Will mutate the `tree` argument.
   *
   * @param  {object} tree
   * @returns {object} The same object, with leaves parsed to ASTs.
   */
  static parseLeaves(tree) {
    _.forEach(tree, (node, key) => {
      if (SyntaxNode.isAST(node)) {
        // already parsed
      } else if (_.isPlainObject(node)) {
        // eslint-disable-next-line no-param-reassign
        tree[key] = this.parseLeaves(node);
      } else if (_.isString(node)) {
        const tokens = this._tokenize(node);
        // eslint-disable-next-line no-param-reassign
        tree[key] = this._parse(tokens, key, node);
      } else {
        ErrorHandler.handleError(
          'Parser',
          'Values can only be other objects or strings',
          { halt: true }
        );
      }
    });

    return tree;
  }

  /**
   * Parses a single string of copy into an AST.
   *
   * @param {string} key
   * @param {string} copy
   * @returns {SyntaxNode|null}
   */
  static parseSingle(key, copy) {
    if (!_.isString(copy)) {
      ErrorHandler.handleError(
        'Parser',
        'Can only parse strings as copy',
        { halt: true }
      );
    }

    const tokens = this._tokenize(copy);
    return this._parse(tokens, key, copy);
  }

  /**
   * Validates the tag is an allowed HTML tag.
   *
   * @param tag String.
   * @private
   */
  static _validateTag(tag) {
    if (!_.includes(this.ALLOWED_HTML_TAGS, tag)) {
      ErrorHandler.handleError(
        'Parser',
        `Unknown HTML tag '<${tag}>' found in formatting`,
        { halt: true }
      );
    }
  }

  /**
   * Turns a string into an array of tokens to be parsed.
   *
   * @param  {string} string
   * @returns {Array} The array of tokens.
   */
  static _tokenize(string) {
    const tokens = [];
    let remainder = string;
    let withinArgs = false;

    while (remainder.length > 0) {
      let nonTextTokenFound = false;
      const isArgsStart = _.startsWith(remainder, this.TOKENS.ARGS_START);

      if (!isArgsStart) {
        _.forEach(this.NON_TEXT_TOKENS, (nonTextToken) => {
          if (_.startsWith(remainder, nonTextToken)) {
            const last = _.last(tokens);

            // Handle escaping special characters
            if (last && last.type === this.TOKENS.TEXT && last.text.slice(-1) === '\\') {
              last.text = last.text.substr(0, last.text.length - 1) + remainder[0];
              remainder = remainder.slice(1);
            } else {
              tokens.push({ type: nonTextToken });
              remainder = remainder.slice(nonTextToken.length);
            }

            nonTextTokenFound = true;
            return false; // kill the loop
          }
        });
      }

      if (nonTextTokenFound) {
        continue;
      }

      // Special processing for TAG and ARGS tags and default processing for TEXT tag
      const last = _.last(tokens);
      let regexMatch = null;

      if (isArgsStart) {
        tokens.push({ type: this.TOKENS.ARGS_START });
        remainder = remainder.slice(this.TOKENS.ARGS_START.length);
        withinArgs = true;
      } else if (withinArgs && _.startsWith(remainder, this.TOKENS.ARGS_COMMA)) {
        tokens.push({ type: this.TOKENS.ARGS_COMMA });
        remainder = remainder.slice(this.TOKENS.ARGS_COMMA.length);
      } else if (withinArgs && _.startsWith(remainder, this.TOKENS.ARGS_END)) {
        tokens.push({ type: this.TOKENS.ARGS_END });
        remainder = remainder.slice(this.TOKENS.ARGS_END.length);
        withinArgs = false;
        // eslint-disable-next-line no-cond-assign
      } else if (regexMatch = remainder.match(this.HTML_START_TAG_REGEX)) {
        const tag = regexMatch[1];
        this._validateTag(tag);

        tokens.push({
          type: this.TOKENS.HTML_TAG_START,
          tag
        });
        remainder = remainder.slice(regexMatch[0].length);
        // eslint-disable-next-line no-cond-assign
      } else if (regexMatch = remainder.match(this.HTML_END_TAG_REGEX)) {
        const tag = regexMatch[1];
        this._validateTag(tag);

        tokens.push({
          type: this.TOKENS.HTML_TAG_END,
          tag
        });
        remainder = remainder.slice(regexMatch[0].length);
      } else if (last && last.type === this.TOKENS.TEXT) {
        // If text was found and text was the last token, append the text to the previous token.
        last.text += remainder[0];
        remainder = remainder.slice(1);
      } else {
        tokens.push({
          type: this.TOKENS.TEXT,
          text: remainder[0]
        });
        remainder = remainder.slice(1);
      }
    }

    return tokens;
  }

  /* eslint-disable jsdoc/require-returns-check */

  /**
   * Parses an array of tokens into an AST.
   *
   * @param  {Array} tokens
   * @param  {string} key The copy key being parsed.
   * @param  {string} string The raw copy string that was tokenized.
   * @returns {AST} The constructed AST.
   * @throws If the string is not fully parsed.
   */
  static _parse(tokens, key, string) {
    try {
      const {
        ast, remainingTokens
      } = this._parseTokens(tokens, key);

      if (_.isEmpty(remainingTokens)) {
        return ast;
      }

      ErrorHandler.handleError(
        'Parser',
        `Incomplete parse for: ${string}`,
        { halt: true }
      );
    } catch (error) {
      ErrorHandler.handleError(
        'Parser',
        `Failed to parse string: ${string}\nReason: ${error.message}`,
        { halt: true }
      );
    }
  }

  /**
   * Returns a parsed text token.
   *
   * @param  {Array} tokens
   * @returns {object} A parsed text token.
   * @throws If a text token is not found.
   */
  static _getTextToken(tokens) {
    const token = _.first(tokens);
    if (token && token.type === this.TOKENS.TEXT) {
      return {
        text: token.text,
        tokens: tokens.slice(1)
      };
    }

    ErrorHandler.handleError(
      'Parser',
      'Expected text value',
      { halt: true }
    );
  }

  /**
   * Removes a close token from the passed tokens. Errors .
   *
   * @param  {Array} tokens
   * @returns {Array}
   * @throws If a close token is not found.
   */
  static _processCloseToken(tokens) {
    const token = _.first(tokens);
    if (token && token.type === this.TOKENS.CLOSE) {
      return tokens.slice(1);
    }

    ErrorHandler.handleError(
      'Parser',
      `Expected close character ${this.TOKENS.CLOSE}`,
      { halt: true }
    );
  }

  /**
   * Recursively parses arguments from a Functional token.
   *
   * @param  {Array} tokens
   * @returns {object} The parsed arguments.
   * @throws If a token other than ARGS_COMMA or ARGS_END is found.
   */
  static _parseArguments(tokens) {
    let args, tokensToReturn;

    const textParsed = this._getTextToken(tokens);
    args = [textParsed.text.trim()];

    const token = _.first(textParsed.tokens);
    if (token.type === this.TOKENS.ARGS_COMMA) {
      const argumentsParsed = this._parseArguments(textParsed.tokens.slice(1));
      args = _.concat(args, argumentsParsed.args);
      tokensToReturn = argumentsParsed.tokens;
    } else if (token.type === this.TOKENS.ARGS_END) {
      tokensToReturn = textParsed.tokens.slice(1);
    } else {
      ErrorHandler.handleError(
        'Parser',
        `Unexpected token ${token.type} in arguments`,
        { halt: true }
      );
    }

    return {
      args,
      tokens: tokensToReturn
    };
  }

  /**
   * Returns an absolute version of `relativeKey` built on the structure of `key`.
   *
   * @param {string} key The original copy key being parsed.
   * @param {string} relativeKey The key to find relative to `key`.
   * @returns {string} The absolute version of relativeKey.
   */
  static _getRelativeKey(key, relativeKey) {
    if (!_.startsWith(relativeKey, KEY_DELIMITER)) {
      return relativeKey;
    }

    const prefixRegex = new RegExp(`\\${KEY_DELIMITER}+`);
    const keys = _.split(key, KEY_DELIMITER);
    const parentSteps = Math.min(
      relativeKey.match(prefixRegex)[0].length,
      keys.length
    );

    return keys
      .slice(0, keys.length - parentSteps)
      .join(KEY_DELIMITER)
      .concat(relativeKey.substring(parentSteps - 1));
  }

  /**
   * Returns a parsed text token. Attempts to resolve relative key references.
   *
   * @param {string} key The original copy key being parsed.
   * @param {Array} tokens
   * @returns {object} A parsed text token.
   */
  static _getReferenceKeyToken(key, tokens) {
    const textParsed = this._getTextToken(tokens);
    textParsed.text = this._getRelativeKey(key, textParsed.text);

    return textParsed;
  }

  /**
   * Recursively processes an array of tokens to build an AST optionally expecting an ending token.
   *
   * @param {Array} tokens
   * @param {string} key The copy key being parsed.
   * @param {boolean} [isRestricted]
   * @param {TOKENS} [expectedEndingToken]
   * @returns {object} Contains the AST and any remaining tokens.
   * @throws If an ending token is expected and not found.
   * @throws If an unsupported token is found.
   */
  static _parseTokens(
    tokens,
    key,
    isRestricted = false,
    expectedEndingToken = this.TOKENS.SWITCH_DELIM
  ) {
    if (_.isEmpty(tokens)) {
      if (isRestricted) {
        ErrorHandler.handleError(
          'Parser',
          `Expected closing ${expectedEndingToken}`,
          { halt: true }
        );
      } else {
        return {
          ast: null,
          tokens
        };
      }
    }

    const token = _.first(tokens);
    const tokensToParse = tokens.slice(1);

    if (isRestricted && token.type === expectedEndingToken) {
      return {
        ast: null,
        tokens: tokensToParse
      };
    } else if (token.type === this.TOKENS.NEWLINE) {
      const parsed = isRestricted ?
        this._parseTokens(tokensToParse, key, true, expectedEndingToken) :
        this._parseTokens(tokensToParse, key);
      return {
        ast: new Newline({ sibling: parsed.ast }),
        tokens: parsed.tokens
      };
    } else if (token.type === this.TOKENS.WORD_BREAK) {
      const parsed = isRestricted ?
        this._parseTokens(tokensToParse, key, true, expectedEndingToken) :
        this._parseTokens(tokensToParse, key);
      return {
        ast: new WordBreak({ sibling: parsed.ast }),
        tokens: parsed.tokens
      };
    } else if (token.type === this.TOKENS.SWITCH_START) {
      const leftParsed = this._parseTokens(tokensToParse, key, true);
      const rightParsed = this._parseTokens(leftParsed.tokens, key, true);
      const deciderParsed = this._getTextToken(rightParsed.tokens);

      const closeParsedTokens = this._processCloseToken(deciderParsed.tokens);
      const parsed = isRestricted ?
        this._parseTokens(closeParsedTokens, key, true, expectedEndingToken) :
        this._parseTokens(closeParsedTokens, key);

      return {
        ast: new Switch({
          left: leftParsed.ast,
          right: rightParsed.ast,
          key: deciderParsed.text,
          sibling: parsed.ast
        }),
        tokens: parsed.tokens
      };
    } else if (token.type === this.TOKENS.SUB_START) {
      const textParsed = this._getTextToken(tokensToParse);
      const closeParsedTokens = this._processCloseToken(textParsed.tokens);
      const parsed = isRestricted ?
        this._parseTokens(closeParsedTokens, key, true, expectedEndingToken) :
        this._parseTokens(closeParsedTokens, key);

      return {
        ast: new Substitute({
          key: textParsed.text,
          sibling: parsed.ast
        }),
        tokens: parsed.tokens
      };
    } else if (token.type === this.TOKENS.REF_START) {
      const textParsed = this._getReferenceKeyToken(key, tokensToParse);
      const closeParsedTokens = this._processCloseToken(textParsed.tokens);
      const parsed = isRestricted ?
        this._parseTokens(closeParsedTokens, key, true, expectedEndingToken) :
        this._parseTokens(closeParsedTokens, key);

      return {
        ast: new Reference({
          key: textParsed.text,
          sibling: parsed.ast
        }),
        tokens: parsed.tokens
      };
    } else if (token.type === this.TOKENS.REF_SUB_START) {
      const textParsed = this._getTextToken(tokensToParse);
      const closeParsedTokens = this._processCloseToken(textParsed.tokens);
      const parsed = isRestricted ?
        this._parseTokens(closeParsedTokens, key, true, expectedEndingToken) :
        this._parseTokens(closeParsedTokens, key);

      return {
        ast: new RefSubstitute({
          key: textParsed.text,
          sibling: parsed.ast
        }),
        tokens: parsed.tokens
      };
    } else if (token.type === this.TOKENS.FUNC_START) {
      const firstParsed = this._parseTokens(tokensToParse, key, true);
      const textParsed = this._getTextToken(firstParsed.tokens);

      let argumentsParsed, parsedOptionalArgumentsTokens;
      if (textParsed.tokens[0].type === this.TOKENS.CLOSE) {
        parsedOptionalArgumentsTokens = this._processCloseToken(textParsed.tokens);
      } else if (textParsed.tokens[0].type === this.TOKENS.ARGS_START) {
        argumentsParsed = this._parseArguments(textParsed.tokens.slice(1));
        parsedOptionalArgumentsTokens = argumentsParsed.tokens;
      }

      const parsed = isRestricted ?
        this._parseTokens(parsedOptionalArgumentsTokens, key, true, expectedEndingToken) :
        this._parseTokens(parsedOptionalArgumentsTokens, key);

      return {
        ast: new Functional({
          copy: firstParsed.ast,
          key: textParsed.text,
          args: _.get(argumentsParsed, 'args'),
          sibling: parsed.ast
        }),
        tokens: parsed.tokens
      };
    } else if (token.type === this.TOKENS.HTML_TAG_START) {
      const tag = token.tag;
      const tagParsed = this._parseTokens(tokensToParse, key, true, this.TOKENS.HTML_TAG_END);
      const parsed = isRestricted ?
        this._parseTokens(tagParsed.tokens, key, true, expectedEndingToken) :
        this._parseTokens(tagParsed.tokens, key);

      return {
        ast: new Formatting({
          tag,
          copy: tagParsed.ast,
          sibling: parsed.ast
        }),
        tokens: parsed.tokens
      };
    } else if (token.type === this.TOKENS.TEXT) {
      const textParsed = this._getTextToken(tokens);
      const parsed = isRestricted ?
        this._parseTokens(textParsed.tokens, key, true, expectedEndingToken) :
        this._parseTokens(textParsed.tokens, key);

      return {
        ast: new Verbatim({
          text: textParsed.text,
          sibling: parsed.ast
        }),
        tokens: parsed.tokens
      };
    }

    const errorMessage = isRestricted ?
      `Unexpected restricted token ${token.type}` :
      `Unexpected token ${token.type}`;
    ErrorHandler.handleError('Parser', errorMessage, { halt: true });
  }

  /* eslint-enable jsdoc/require-returns-check */

  /**
   * Parser is a singleton and will error when trying to create an instance.
   *
   * @throws {Error}
   */
  constructor() {
    ErrorHandler.handleError('Parser', 'Parser is a singleton', { halt: true });
  }
}

Parser.TOKENS = TOKENS;
Parser.NON_TEXT_TOKENS = NON_TEXT_TOKENS;
Parser.HTML_START_TAG_REGEX = HTML_START_TAG_REGEX;
Parser.HTML_END_TAG_REGEX = HTML_END_TAG_REGEX;
Parser.ALLOWED_HTML_TAGS = ALLOWED_HTML_TAGS;
Parser.KEY_DELIMITER = KEY_DELIMITER;

module.exports = Parser;
