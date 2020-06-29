import SyntaxNode from '../SyntaxNode/SyntaxNode';

/**
 * Represents a reference to another copy key in an AST.
 */
class Reference extends SyntaxNode {
  /**
   * @param  {object} options
   */
  constructor(options) {
    super(options);

    /**
     * The copy key being referenced, with leading and trailing whitespace trimmed.
     * @type {string}
     */
    this.key = options.key.trim();
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
    const ast = copyService.getAstForKey(this.key);

    if (ast) {
      const astCacheable = ast.isCacheable(copyService);

      if (this.sibling) {
        return astCacheable && this.sibling.isCacheable(copyService);
      }

      return astCacheable;
    }

    return false;
  }

  toSyntax() {
    return (
      `\${${this.key}}${this.safeToSyntax(this.sibling)}`
    );
  }
}

export default Reference;
