import CopyService from '../CopyService';
import IntlCopyService from '../IntlCopyService';
import SyntaxNode from '../SyntaxNode/SyntaxNode';

/**
 * Represents text in an AST.
 */
class Verbatim extends SyntaxNode {
  /**
   * The string.
   */
  text: string;

  /**
   * The neighboring AST.
   */
  sibling: SyntaxNode | null;

  constructor(options: {
    text: string;
    sibling: SyntaxNode | null;
  }) {
    super();

    this.text = options.text;
    this.sibling = options.sibling || null;
  }

  /**
   * True if this node can be cached after evaluation.
   */
  override isCacheable(copyService: CopyService | IntlCopyService): boolean {
    return this.sibling ? this.sibling.isCacheable(copyService) : true;
  }

  /**
   * Converts the AST node to the syntax that made it.
   */
  override toSyntax(): string {
    return `${this.text}${this.safeToSyntax(this.sibling)}`;
  }
}

export default Verbatim;
