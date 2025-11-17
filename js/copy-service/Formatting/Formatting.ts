import SyntaxNode from '../SyntaxNode/SyntaxNode';

import CopyService from '../CopyService';
import IntlCopyService from '../IntlCopyService';

/**
 * Represents an HTML tag in the AST.
 */
class Formatting extends SyntaxNode {
  /**
   * The neighboring AST.
   *
   * @type {SyntaxNode|null}
   */
  readonly sibling: SyntaxNode | null;

  /**
   * An AST representing the string displayed inside the HTML tag.
   *
   * @type {SyntaxNode|null}
   */
  readonly copy: SyntaxNode | null;

  /**
   * The tag as a string.
   *
   * @type {string}
   */
  readonly tag: string;

  constructor(options: {
    sibling: SyntaxNode | null;
    copy: SyntaxNode | null;
    tag: string;
  }) {
    super();

    this.sibling = options.sibling || null;
    this.copy = options.copy || null;
    this.tag = options.tag;
  }

  /**
   * @param {CopyService | IntlCopyService} copyService
   * @returns {boolean} True if this node can be cached after evaluation.
   */
  override isCacheable(copyService: CopyService | IntlCopyService): boolean {
    if (this.sibling) {
      if (this.copy) {
        return this.sibling.isCacheable(copyService) && this.copy.isCacheable(copyService);
      }

      return this.sibling.isCacheable(copyService);
    } else if (this.copy) {
      return this.copy.isCacheable(copyService);
    }

    return true;
  }

  /**
   * Converts the AST node to the syntax that made it.
   *
   * @returns {string}
   */
  override toSyntax(): string {
    return (
      `<${this.tag}>${this.safeToSyntax(this.copy)}</${this.tag}>${this.safeToSyntax(this.sibling)}`
    );
  }
}

export default Formatting;
