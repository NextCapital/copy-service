import SyntaxNode from '../SyntaxNode/SyntaxNode';

/**
 * Represents a newline in an AST.
 */
class Newline extends SyntaxNode {
  /**
   * @param  {object} options
   */
  constructor(options) {
    super(options);

    /**
     * The neighboring AST.
     * @type {SyntaxNode|null}
     */
    this.sibling = options.sibling;
  }

  /**
   * @returns {boolean} true if this node can be cached after evaluation
   */
  isCacheable(copyService) {
    if (this.sibling) {
      return this.sibling.isCacheable(copyService);
    }

    return true;
  }

  toSyntax() {
    return `\n${this.safeToSyntax(this.sibling)}`;
  }
}

export default Newline;
