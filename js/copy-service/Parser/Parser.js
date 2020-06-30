import _ from 'lodash';

import SyntaxNode from '../SyntaxNode/SyntaxNode';
import Formatting from '../Formatting/Formatting';
import Functional from '../Functional/Functional';
import Newline from '../Newline/Newline';
import Reference from '../Reference/Reference';
import RefSubstitute from '../RefSubstitute/RefSubstitute';
import Substitute from '../Substitute/Substitute';
import Switch from '../Switch/Switch';
import Verbatim from '../Verbatim/Verbatim';

import ErrorHandler from '../ErrorHandler/ErrorHandler';

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
  NEWLINE: '\n'
};

/**
 * Parses raw json copy into ASTs.
 */
class Parser {
  /**
   * RegExp for the starting tag of allowed HTML tags.
   * @type {RegExp}
   */
  static ALLOWED_HTML_START_TAG_REGEX = /^<(b|i|u|sup|sub|s|em|p|span|div|ol|ul|li)>/;
  /**
   * RegExp for the ending tag of allowed HTML tags.
   * @type {RegExp}
   */
  static ALLOWED_HTML_END_TAG_REGEX = /^<\/(b|i|u|sup|sub|s|em|p|span|div|ol|ul|li)>/;
  /**
   * The supported HTML tags in copy.
   * @type {Array}
   */
  static ALLOWED_HTML_TAGS = [
    'b', 'i', 'u', 'sup', 'sub', 's', 'em', 'p', 'span', 'div', 'ol', 'ul', 'li'
  ];

  /**
   * The supported tokens in copy.
   * @type {Object}
   */
  static TOKENS = TOKENS;

  /**
   * All TOKENS that are not TEXT, TAG, or ARGS tokens.
   * @type {Array}
   */
  static NON_TEXT_TOKENS = _.filter(_.values(TOKENS), (token) => (
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
   * Transforms raw copy into ASTs.
   * @param  {object} tree
   * @return {object}
   */
  static parseLeaves(tree) {
    _.forEach(tree, (node, key) => {
      if (SyntaxNode.isAST(node)) {
        return; // already parsed
      } else if (_.isObject(node) && !_.isArray(node) && !_.isFunction(node)) {
        tree[key] = this.parseLeaves(node);
      } else if (_.isString(node)) {
        const tokens = this._tokenize(node);
        tree[key] = this._parse(tokens, node);
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

  static parseSingle(copy) {
    if (!_.isString(copy)) {
      ErrorHandler.handleError(
        'Parser',
        'Can only parse strings as copy',
        { halt: true }
      );
    }

    const tokens = this._tokenize(copy);
    return this._parse(tokens, copy);
  }

  /**
   * Validates the tag is an allowed HTML tag.
   * @param  {string} string
   * @private
   */
  static _validateTag(tag) {
    if (!_.includes(this.ALLOWED_HTML_TAGS, tag)) {
      ErrorHandler.handleError(
        'Parser',
        `Unknown HTML tag '${tag}' found in formatting`,
        { halt: true }
      );
    }
  }

  /**
   * Turns a string into an array of tokens to be parsed.
   * @param  {string} string
   * @return {array} The array of tokens.
   */
  static _tokenize(string) {
    const tokens = [];
    let remainder = string;
    let withinArgs = false;

    while (remainder.length > 0) {
      let nonTextTokenFound = false;

      _.forEach(this.NON_TEXT_TOKENS, (nonTextToken) => {
        if (
          !nonTextTokenFound &&
          _.startsWith(remainder, nonTextToken) &&
          !_.startsWith(remainder, this.TOKENS.ARGS_START)
        ) {
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
        }
      });

      if (nonTextTokenFound) {
        continue;
      }

      // Special processing for TAG and ARGS tags and default processing for TEXT tag
      const last = _.last(tokens);
      let regexMatch = null;

      if (_.startsWith(remainder, this.TOKENS.ARGS_START)) {
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
      } else if (regexMatch = remainder.match(this.ALLOWED_HTML_START_TAG_REGEX)) {
        const tag = regexMatch[1];
        this._validateTag(tag);

        tokens.push({
          type: this.TOKENS.HTML_TAG_START,
          tag
        });
        remainder = remainder.slice(regexMatch[0].length);
      } else if (regexMatch = remainder.match(this.ALLOWED_HTML_END_TAG_REGEX)) {
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

  /**
   * Parses an array of tokens into an AST.
   * @param  {array} tokens
   * @param  {string} string The raw copy string that was tokenized.
   * @return {AST}
   * @throws If the string is not fully parsed.
   */
  static _parse(tokens, string) {
    try {
      const {
        ast, remainingTokens
      } = this._parseTokens(tokens);

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
   * @param  {array} tokens
   * @return {object} A parsed text token.
   * @throws If a text token is not found
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
   * @param  {array} tokens
   * @return {array}
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
   * @param  {array} tokens
   * @return {object} The parsed arguments.
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

  /* eslint-disable brace-style */

  /**
   * Recursively processes an array of tokens to build an AST optionally expecting an ending token.
   * @param {array} tokens
   * @param {boolean} [isRestricted]
   * @param {TOKENS} [expectedEndingToken]
   * @return {object} Contains the AST and any remaining tokens.
   * @throws If an ending token is expected and not found.
   * @throws If an unsupported token is found.
   */
  static _parseTokens(
    tokens, isRestricted = false, expectedEndingToken = this.TOKENS.SWITCH_DELIM
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
    }

    else if (token.type === this.TOKENS.NEWLINE) {
      const parsed = isRestricted ?
        this._parseTokens(tokensToParse, true, expectedEndingToken) :
        this._parseTokens(tokensToParse);
      return {
        ast: new Newline({ sibling: parsed.ast }),
        tokens: parsed.tokens
      };
    }

    else if (token.type === this.TOKENS.SWITCH_START) {
      const leftParsed = this._parseTokens(tokensToParse, true);
      const rightParsed = this._parseTokens(leftParsed.tokens, true);
      const deciderParsed = this._getTextToken(rightParsed.tokens);

      const closeParsedTokens = this._processCloseToken(deciderParsed.tokens);
      const parsed = isRestricted ?
        this._parseTokens(closeParsedTokens, true, expectedEndingToken) :
        this._parseTokens(closeParsedTokens);

      return {
        ast: new Switch({
          left: leftParsed.ast,
          right: rightParsed.ast,
          key: deciderParsed.text,
          sibling: parsed.ast
        }),
        tokens: parsed.tokens
      };
    }

    else if (token.type === this.TOKENS.SUB_START) {
      const textParsed = this._getTextToken(tokensToParse);
      const closeParsedTokens = this._processCloseToken(textParsed.tokens);
      const parsed = isRestricted ?
        this._parseTokens(closeParsedTokens, true, expectedEndingToken) :
        this._parseTokens(closeParsedTokens);

      return {
        ast: new Substitute({
          key: textParsed.text,
          sibling: parsed.ast
        }),
        tokens: parsed.tokens
      };
    }

    else if (token.type === this.TOKENS.REF_START) {
      const textParsed = this._getTextToken(tokensToParse);
      const closeParsedTokens = this._processCloseToken(textParsed.tokens);
      const parsed = isRestricted ?
        this._parseTokens(closeParsedTokens, true, expectedEndingToken) :
        this._parseTokens(closeParsedTokens);

      return {
        ast: new Reference({
          key: textParsed.text,
          sibling: parsed.ast
        }),
        tokens: parsed.tokens
      };
    }

    else if (token.type === this.TOKENS.REF_SUB_START) {
      const textParsed = this._getTextToken(tokensToParse);
      const closeParsedTokens = this._processCloseToken(textParsed.tokens);
      const parsed = isRestricted ?
        this._parseTokens(closeParsedTokens, true, expectedEndingToken) :
        this._parseTokens(closeParsedTokens);

      return {
        ast: new RefSubstitute({
          key: textParsed.text,
          sibling: parsed.ast
        }),
        tokens: parsed.tokens
      };
    }

    else if (token.type === this.TOKENS.FUNC_START) {
      const firstParsed = this._parseTokens(tokensToParse, true);
      const textParsed = this._getTextToken(firstParsed.tokens);

      let argumentsParsed, parsedOptionalArgumentsTokens;
      if (textParsed.tokens[0].type === this.TOKENS.CLOSE) {
        parsedOptionalArgumentsTokens = this._processCloseToken(textParsed.tokens);
      } else if (textParsed.tokens[0].type === this.TOKENS.ARGS_START) {
        argumentsParsed = this._parseArguments(textParsed.tokens.slice(1));
        parsedOptionalArgumentsTokens = argumentsParsed.tokens;
      }

      const parsed = isRestricted ?
        this._parseTokens(parsedOptionalArgumentsTokens, true, expectedEndingToken) :
        this._parseTokens(parsedOptionalArgumentsTokens);

      return {
        ast: new Functional({
          copy: firstParsed.ast,
          key: textParsed.text,
          args: _.get(argumentsParsed, 'args'),
          sibling: parsed.ast
        }),
        tokens: parsed.tokens
      };
    }

    else if (token.type === this.TOKENS.HTML_TAG_START) {
      const tag = token.tag;
      const tagParsed = this._parseTokens(tokensToParse, true, this.TOKENS.HTML_TAG_END);
      const parsed = isRestricted ?
        this._parseTokens(tagParsed.tokens, true, expectedEndingToken) :
        this._parseTokens(tagParsed.tokens);

      return {
        ast: new Formatting({
          tag,
          copy: tagParsed.ast,
          sibling: parsed.ast
        }),
        tokens: parsed.tokens
      };
    }

    else if (token.type === this.TOKENS.TEXT) {
      const textParsed = this._getTextToken(tokens);
      const parsed = isRestricted ?
        this._parseTokens(textParsed.tokens, true, expectedEndingToken) :
        this._parseTokens(textParsed.tokens);

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

  /* eslint-enable brace-style */

  /**
   * Parser is a singleton and will error when trying to create an instance.
   * @throws {Error}
   */
  constructor() {
    ErrorHandler.handleError('Parser', 'Parser is a singleton', { halt: true });
  }
}

export default Parser;
