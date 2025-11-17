import CopyService from '../CopyService';
import IntlCopyService from '../IntlCopyService';
import SyntaxNode from '../SyntaxNode/SyntaxNode';

/**
 * Represents a newline in an AST.
 */
class Newline extends SyntaxNode {
  /**
   * The neighboring AST.
   *
   * @type {SyntaxNode|null}
   */
  sibling: SyntaxNode | null;

  constructor(options: {
    sibling: SyntaxNode | null;
  }) {
    super();

    this.sibling = options.sibling || null;
  }

  /**
   * True if this node can be cached after evaluation.
   */
  override isCacheable(copyService: CopyService | IntlCopyService): boolean {
    if (this.sibling) {
      return this.sibling.isCacheable(copyService);
    }

    return true;
  }

  /**
   * Converts the AST node to the syntax that made it.
   */
  override toSyntax(): string {
    return `\n${this.safeToSyntax(this.sibling)}`;
  }
}

export default Newline;
