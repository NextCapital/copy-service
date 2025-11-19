const PlainTextEvaluator = require('../plain-text-evaluator/PlainTextEvaluator').default;

/**
 * Provides an interface that can register copy, determine the existence of copy, and generate copy
 * recursively evaluated with substitutions.
 *
 * @interface
 */
class HtmlEvaluator extends PlainTextEvaluator {
  /**
   * `HtmlEvaluator` treats `Newline` nodes as `<br/>` tags.
   *
   * @returns {boolean}
   */
  getNewline() {
    return '<br/>';
  }

  /**
   * `HtmlEvaluator` treats `WordBreak` nodes as `<wbr/>` tags.
   *
   * @returns {string}
   */
  getWordBreak() {
    return '<wbr/>';
  }

  /**
   * `HtmlEvaluator` allows `Formatting` AST nodes to include their tags.
   *
   * @returns {boolean}
   */
  allowsFormattingTags() {
    return true;
  }
}

module.exports = HtmlEvaluator;
