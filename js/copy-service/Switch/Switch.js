import SyntaxNode from '../SyntaxNode/SyntaxNode';

/**
 * Represents a logic branch in an AST.
 */
class Switch extends SyntaxNode {
  /**
   * @param  {object} options
   */
  constructor(options) {
    super(options);

    /**
     * The substitution key for the decider, with leading and trailing whitespace trimmed.
     * @type {string}
     */
    this.key = options.key.trim();
    /**
     * The neighboring AST.
     * @type {SyntaxNode|null}
     */
    this.sibling = options.sibling;
    /**
     * The AST to use when the decider is evaluated to truthy.
     * @type {SyntaxNode|null}
     */
    this.left = options.left;
    /**
     * The AST to use when the decider is evaluated to falsy.
     * @type {SyntaxNode|null}
     */
    this.right = options.right;
  }

  /**
   * @returns {boolean} true if this node can be cached after evaluation
   */
  isCacheable() {
    return false;
  }
}

export default Switch;
