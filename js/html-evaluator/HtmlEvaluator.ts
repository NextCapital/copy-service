import PlainTextEvaluator from '../plain-text-evaluator/PlainTextEvaluator.js';

/**
 * Provides an interface that can register copy, determine the existence of copy, and generate copy
 * recursively evaluated with substitutions.
 */
class HtmlEvaluator extends PlainTextEvaluator {
  /**
   * `HtmlEvaluator` treats `Newline` nodes as `<br/>` tags.
   */
  override getNewline(): string {
    return '<br/>';
  }

  /**
   * `HtmlEvaluator` treats `WordBreak` nodes as `<wbr/>` tags.
   */
  override getWordBreak(): string {
    return '<wbr/>';
  }

  /**
   * `HtmlEvaluator` allows `Formatting` AST nodes to include their tags.
   */
  override allowsFormattingTags(): boolean {
    return true;
  }
}

export default HtmlEvaluator;
