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
import WordBreak from '../WordBreak/WordBreak';

import ErrorHandler from '../ErrorHandler/ErrorHandler';

type leafParam = SyntaxNode | string | null | { [key: string]: leafParam; };

/**
 * Parses raw json copy into ASTs.
 */
class Parser {
  /**
   * The supported tokens in copy.
   *
   * @type {object}
   */
  static TOKENS = {
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
  } as const;

  /**
   * All TOKENS that are not TEXT, TAG, or ARGS tokens.
   *
   * @type {Array}
   */
  static NON_TEXT_TOKENS = _.filter(_.values(this.TOKENS), (token) => (
    !_.includes([
      this.TOKENS.TEXT,
      this.TOKENS.HTML_TAG_START,
      this.TOKENS.HTML_TAG_END,
      this.TOKENS.ARGS_START,
      this.TOKENS.ARGS_COMMA,
      this.TOKENS.ARGS_END
    ], token)
  ));

  /**
   * RegExp for the starting tag of allowed HTML tags.
   *
   * @type {RegExp}
   */
  static HTML_START_TAG_REGEX = /^<(\w+)>/;

  /**
   * RegExp for the ending tag of allowed HTML tags.
   *
   * @type {RegExp}
   */
  static HTML_END_TAG_REGEX = /^<\/(\w+)>/;

  /**
   * The supported HTML tags in copy.
   *
   * @type {Array}
   */
  static ALLOWED_HTML_TAGS = [
    // cspell:disable-next-line
    'u', 'sup', 'sub', 's', 'em', 'strong', 'p', 'span', 'div', 'ol', 'ul', 'li', 'b', 'i', 'u'
  ] as const;

  /**
   * The supported delimiter for subkeys.
   *
   * @type {string}
   */
  static KEY_DELIMITER = '.';

  /**
   * Transforms raw copy into ASTs. Will mutate the `tree` argument.
   */
  static parseLeaves(tree: { [key: string]: leafParam; }): { [key: string]: leafParam; } {
    _.forEach(tree, (node: leafParam, key: string) => {
      if (SyntaxNode.isAST(node)) {
        // already parsed
      } else if (_.isPlainObject(node)) {
        // eslint-disable-next-line no-param-reassign
        tree[key] = this.parseLeaves(node as { [key: string]: leafParam; });
      } else if (_.isString(node)) {
        const tokens = this._tokenize(node);
        // eslint-disable-next-line no-param-reassign
        tree[key] = this._parse(tokens, key, node);
      }
    });

    return tree;
  }

  /**
   * Parses a single string of copy into an AST.
   */
  static parseSingle(key: string, copy: string): SyntaxNode | null {
    const tokens = this._tokenize(copy);
    return this._parse(tokens, key, copy);
  }

  /**
   * Validates the tag is an allowed HTML tag.
   *
   * @private
   */
  static _validateTag(tag: string): void {
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
   */
  static _tokenize(string: string): Array<{ [key: string]: string | undefined; }> {
    const tokens: Array<{ [key: string]: string; }> = [];
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

  /**
   * Parses an array of tokens into an AST.
   */
  static _parse(
    tokens: Array<{ [key: string]: string | undefined; }>,
    key: string,
    string: string
  ): SyntaxNode | null | never {
    try {
      const {
        ast,
        tokens: remainingTokens
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
   */
  static _getTextToken(
    tokens: Array<{ [key: string]: string | undefined; }>
  ): {
    text: string;
    tokens: Array<{ [key: string]: string | undefined; }>;
  } | never {
    const token = _.first(tokens);

    if (token && token.type === this.TOKENS.TEXT) {
      return {
        text: token.text as string,
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
   * Removes a close token from the passed tokens. Errors.
   */
  static _processCloseToken(
    tokens: Array<{ [key: string]: string | undefined; }>
  ): Array<{ [key: string]: string | undefined; }> | never {
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
   */
  static _parseArguments(
    tokens: Array<{ [key: string]: string | undefined; }>
  ): {
    args: string[];
    tokens: Array<{ [key: string]: string | undefined; }>;
  } | never {
    let args: string[];
    let tokensToReturn: Array<{ [key: string]: string | undefined; }>;

    const textParsed = this._getTextToken(tokens);
    args = [textParsed.text.trim()];

    const token = _.first(textParsed.tokens);
    if (!token) {
      ErrorHandler.handleError(
        'Parser',
        'Unexpected end of tokens while parsing arguments',
        { halt: true }
      );
    }

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
   */
  static _getRelativeKey(key: string, relativeKey: string): string {
    if (!_.startsWith(relativeKey, this.KEY_DELIMITER)) {
      return relativeKey;
    }

    const prefixRegex = new RegExp(`\\${this.KEY_DELIMITER}+`);
    const keys = _.split(key, this.KEY_DELIMITER);
    const parentSteps = Math.min(
      relativeKey.match(prefixRegex)![0].length,
      keys.length
    );

    return keys
      .slice(0, keys.length - parentSteps)
      .join(this.KEY_DELIMITER)
      .concat(relativeKey.substring(parentSteps - 1));
  }

  /**
   * Returns a parsed text token. Attempts to resolve relative key references.
   */
  static _getReferenceKeyToken(
    key: string,
    tokens: Array<{ [key: string]: string | undefined; }>
  ): {
      text: string;
      tokens: Array<{ [key: string]: string | undefined; }>;
    } {
    const textParsed = this._getTextToken(tokens);
    textParsed.text = this._getRelativeKey(key, textParsed.text);

    return textParsed;
  }

  /**
   * Recursively processes an array of tokens to build an AST optionally expecting an ending token.
   */
  static _parseTokens(
    tokens: Array<{ [key: string]: string | undefined; }>,
    key: string,
    isRestricted: boolean = false,
    expectedEndingToken: string = this.TOKENS.SWITCH_DELIM
  ): {
    ast: SyntaxNode | null;
    tokens: Array<{ [key: string]: string | undefined; }>;
  } | never {
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

    const token = tokens[0];
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

      let argumentsParsed: {
        args: string[];
        tokens: Array<{ [key: string]: string | undefined; }>;
      } | undefined;
      let parsedOptionalArgumentsTokens: Array<{ [key: string]: string | undefined; }>;

      if (textParsed.tokens[0].type === this.TOKENS.CLOSE) {
        parsedOptionalArgumentsTokens = this._processCloseToken(textParsed.tokens);
      } else if (textParsed.tokens[0].type === this.TOKENS.ARGS_START) {
        argumentsParsed = this._parseArguments(textParsed.tokens.slice(1));
        parsedOptionalArgumentsTokens = argumentsParsed.tokens;
      }

      const parsed = isRestricted ?
        this._parseTokens(parsedOptionalArgumentsTokens!, key, true, expectedEndingToken) :
        this._parseTokens(parsedOptionalArgumentsTokens!, key);

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
      const tag = token.tag!;
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

  /**
   * Parser is a singleton and will error when trying to create an instance.
   */
  constructor() {
    ErrorHandler.handleError('Parser', 'Parser is a singleton', { halt: true });
  }
}

export default Parser;
