import SyntaxNode from '../SyntaxNode/SyntaxNode';

/**
 * Represents text in an AST.
 */
class Verbatim extends SyntaxNode {
  /**
   * @param  {object} options
   */
  constructor(options) {
    super(options);

    /**
     * @type {string}
     */
    this.text = options.text;
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
    return (
      `${this.text}${this.safeToSyntax(this.sibling)}`
    );
  }
}

export default Verbatim;
