import PlainTextEvaluator from '../plain-text-evaluator/PlainTextEvaluator';

/**
 * Provides an interface that can register copy, determine the existence of copy, and generate copy
 * recursively evaluated with substitutions.
 *
 * @interface
 */
class HtmlEvaluator extends PlainTextEvaluator {
  /**
   * `HtmlEvaluator` treats `Newline` nodes as `<br/>` tags.
   */
  getNewline(): string {
    return '<br/>';
  }

  /**
   * `HtmlEvaluator` treats `WordBreak` nodes as `<wbr/>` tags.
   */
  getWordBreak(): string {
    return '<wbr/>';
  }

  /**
   * `HtmlEvaluator` allows `Formatting` AST nodes to include their tags.
   */
  allowsFormattingTags(): boolean {
    return true;
  }
}

export default HtmlEvaluator;
