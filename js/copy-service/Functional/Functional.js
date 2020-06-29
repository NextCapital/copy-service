import _ from 'lodash';
import SyntaxNode from '../SyntaxNode/SyntaxNode';

/**
 * Represents a function in an AST that can be evaluated with copy and arguments from substitutions.
 */
class Functional extends SyntaxNode {
  /**
   * @param  {object} options
   */
  constructor(options) {
    super(options);

    /**
     * The key locating the function substitution, with leading and trailing whitespace trimmed.
     * @type {string}
     */
    this.key = options.key.trim();
    /**
     * The neighboring AST.
     * @type {SyntaxNode|null}
     */
    this.sibling = options.sibling;
    /**
     * An AST representing the string that is passed into the function.
     * @type {SyntaxNode|null}
     */
    this.copy = options.copy;
    /**
     * The string keys corresponding to argument substitutions.
     * @type {Array<string>}
     */
    this.args = options.args || [];
  }

  /**
   * @returns {boolean} true if this node can be cached after evaluation
   */
  isCacheable() {
    return false;
  }

  toSyntax() {
    const args = _.isEmpty(this.args) ?
      '' :
      `[${this.args.join(',')}]`;

    return (
      `^{${this.safeToSyntax(this.copy)}}{${this.key}}${args}${this.safeToSyntax(this.sibling)}`
    );
  }
}

export default Functional;
