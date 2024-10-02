const {
  Substitutions,
  CopyService
} = require('../index.js');

const PlainTextEvaluator = require('../plain-text-evaluator/PlainTextEvaluator');
const HtmlEvaluator = require('./HtmlEvaluator');

describe('HTMLEvaluator', () => {
  let evaluator, copyService, substitutions;

  beforeEach(() => {
    copyService = new CopyService();
    evaluator = new HtmlEvaluator(copyService);

    substitutions = new Substitutions({});
    jest.spyOn(substitutions, 'get');
    jest.spyOn(substitutions, 'getBoolean');
  });

  test('extends PlaintextEvaluator', () => {
    expect(evaluator).toBeInstanceOf(PlainTextEvaluator);
  });

  describe('allowsFormattingTags', () => {
    test('returns true', () => {
      expect(evaluator.allowsFormattingTags()).toBe(true);
    });
  });

  describe('getNewline', () => {
    test('returns a br tag', () => {
      expect(evaluator.getNewline()).toBe('<br/>');
    });
  });

  describe('getWordBreak', () => {
    test('returns a wbr tag', () => {
      expect(evaluator.getWordBreak()).toBe('<wbr/>');
    });
  });
});
