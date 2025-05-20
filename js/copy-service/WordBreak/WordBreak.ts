import CopyService from '../CopyService';
import IntlCopyService from '../IntlCopyService';
import SyntaxNode from '../SyntaxNode/SyntaxNode';

/**
 * Represents a word break in an AST.
 */
class WordBreak extends SyntaxNode {
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
  isCacheable(copyService: CopyService | IntlCopyService ) : boolean {
    if (this.sibling) {
      return this.sibling.isCacheable(copyService);
    }

    return true;
  }

  /**
   * Converts the AST node to the syntax that made it.
   */
  toSyntax(): string {
    return `\b${this.safeToSyntax(this.sibling)}`;
  }
}

export default WordBreak;
