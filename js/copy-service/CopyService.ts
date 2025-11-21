import _ from 'lodash';

import SyntaxNode from './SyntaxNode/SyntaxNode';
import Parser from './Parser/Parser';
import ErrorHandler from './ErrorHandler/ErrorHandler';

export type AST = SyntaxNode | null;

export interface CopyFile {
  [key: string]: string | CopyFile;
}

interface CopyServiceOptions {
  copy?: CopyFile;
  language?: string | null;
}

export interface CopySubkeys {
  [key: string]: CopySubkeys | string | null;
}

export type RegisteredCopyNode = string | AST | {
  [key: string]: RegisteredCopyNode;
};

/**
 * Provides the ability to register, parse, and evaluate copy.
 */
class CopyService {
  private _registeredCopy: { [key: string]: RegisteredCopyNode; };

  language: string | null;

  /**
   * Constructor for the `CopyService`.
   */
  constructor(options: CopyServiceOptions = {}) {
    this._registeredCopy = {};
    this.language = options.language || null;

    if (options.copy) {
      this.registerCopy(options.copy);
    }
  }

  /**
   * Stores the new copy into the copy set. Copy will not be parsed immediately by default. To
   * immediately parse copy into an AST, call `parseAllCopy`.
   */
  registerCopy(jsonCopyConfig?: CopyFile): void {
    if (!_.isPlainObject(jsonCopyConfig)) {
      ErrorHandler.handleError(
        'CopyService',
        'Copy provided in wrong format.'
      );

      return;
    }

    // Clone deep to avoid mutating `jsonCopyConfig`
    this._registeredCopy = this._mergeParsedCopy(
      this._registeredCopy,
      _.cloneDeep(jsonCopyConfig) as CopyFile
    );
  }

  /**
   * Recursively builds all subkeys at which copy exists.
   */
  buildSubkeys(key: string): CopySubkeys {
    const subkeys = this.getSubkeys(key);

    if (!_.isPlainObject(subkeys)) {
      return {};
    }

    return _.mapValues(subkeys as { [key: string]: RegisteredCopyNode; }, (obj, path) => {
      const subPath = `${key}${Parser.KEY_DELIMITER}${path}`;
      if (_.isPlainObject(obj)) {
        return this.buildSubkeys(subPath);
      }

      return subPath;
    });
  }

  /**
   * Returns the value at a passed key.
   */
  getSubkeys(key: string): RegisteredCopyNode | undefined {
    return _.get(this._registeredCopy, key);
  }

  /**
   * Determines if the key exists in the registered copy.
   */
  hasKey(key: string): boolean {
    return !_.isNil(this.getSubkeys(key));
  }

  /**
   * Returns the AST at a given key. Logs error if key is not found in the parsed copy, or if the
   * copy fails to parse. In both cases, `null` will be returned. This is preferable to the page
   * blowing up.
   */
  getAstForKey(key: string): AST | null | undefined {
    const result = _.get(this._registeredCopy, key);

    if (_.isString(result)) { // need to parse to an AST
      try {
        const ast = Parser.parseSingle(key, result);
        _.set(this._registeredCopy, key, ast);
        return ast;
      } catch {
        ErrorHandler.handleError('CopyService', `Failed to parse copy key: ${key}. Returning null...`);
        return null;
      }
    }

    if (_.isUndefined(result) || !SyntaxNode.isAST(result)) {
      if (!this.language) {
        ErrorHandler.handleError(
          'CopyService',
          `No AST found for copy key: ${key}. Returning null...`
        );
      }

      // return undefined when a language is specified so that `IntlCopyService` can differentiate
      // between no result and a result of null.
      return this.language ? undefined : null;
    }

    return result;
  }

  /**
   * Returns the current merged set of of registered copy. This is helpful to get the current
   * set of registered copy when copy is registered via many sources.
   */
  getRegisteredCopy(
    passedNode?: RegisteredCopyNode
  ): { [key: string]: RegisteredCopyNode; } {
    const tree: { [key: string]: RegisteredCopyNode; } = {};
    const nodeToIterate = passedNode || this._registeredCopy;

    if (!_.isPlainObject(nodeToIterate)) {
      return tree;
    }

    _.forEach(nodeToIterate as { [key: string]: RegisteredCopyNode; }, (node, key) => {
      if (_.isNil(node)) {
        tree[key] = '';
      } else if (_.isString(node)) { // not yet parsed
        tree[key] = node;
      } else if (SyntaxNode.isAST(node)) { // parsed
        tree[key] = node.toSyntax();
      } else if (_.isPlainObject(node)) {
        tree[key] = this.getRegisteredCopy(node);
      }
    });

    return tree;
  }

  /**
   * Gets the registered copy for a given copy key.
   */
  getRegisteredCopyForKey(key: string): string | null {
    const result = _.get(this._registeredCopy, key);

    if (result === null) {
      return '';
    }

    if (_.isString(result)) {
      return result;
    }

    if (SyntaxNode.isAST(result)) {
      return result.toSyntax();
    }

    if (!this.language) {
      ErrorHandler.handleError('CopyService', `No AST found for copy key: ${key}. Returning null...`);
    }

    return null;
  }

  /**
   * Parses all copy that has not yet been parsed to an AST.
   *
   * Notably, this will throw an error if any copy fails to parse.
   */
  parseAllCopy(): void {
    Parser.parseLeaves(this._registeredCopy);
  }

  /**
   * Merges the new registered copy into the old registered copy. This will force any
   * strings or AST nodes to replace rather than merge.
   */
  private _mergeParsedCopy(
    existingCopy: { [key: string]: RegisteredCopyNode; },
    newCopy: { [key: string]: RegisteredCopyNode; }
  ): { [key: string]: RegisteredCopyNode; } {
    if (_.isEmpty(existingCopy)) {
      return newCopy;
    }

    if (_.isEmpty(newCopy)) {
      return existingCopy;
    }

    return _.mergeWith(existingCopy, newCopy, (oldValue, newValue) => {
      if (_.isString(newValue)) { // strings always replace
        return newValue;
      }

      if (SyntaxNode.isAST(newValue)) { // AST always replaces
        return newValue;
      }
    });
  }
}

export default CopyService;
