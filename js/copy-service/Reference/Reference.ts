import CopyService from '../CopyService';
import IntlCopyService from '../IntlCopyService';
import SyntaxNode from '../SyntaxNode/SyntaxNode';

/**
 * Represents a reference to another copy key in an AST.
 */
class Reference extends SyntaxNode {
  /**
   * The copy key being referenced, with leading and trailing whitespace trimmed.
   *
   * @type {string}
   */
  readonly key: string;

  /**
   * The neighboring AST.
   *
   * @type {SyntaxNode|null}
   */
  readonly sibling: SyntaxNode | null;

  constructor(options: {
    key: string;
    sibling: SyntaxNode | null;
  }) {
    super();

    this.key = options.key.trim();
    this.sibling = options.sibling || null;
  }

  /**
   * True if this node can be cached after evaluation.
   */
  override isCacheable(copyService: CopyService | IntlCopyService): boolean {
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

  /**
   * Converts the AST node to the syntax that made it.
   */
  override toSyntax(): string {
    return (
      `\${${this.key}}${this.safeToSyntax(this.sibling)}`
    );
  }
}

export default Reference;
