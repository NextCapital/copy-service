import {
  Formatting,
  Functional,
  Newline,
  Reference,
  Substitute,
  Switch,
  Verbatim,

  Evaluator
} from '@nextcapital/copy-service';

import PlaintextEvaluator from './PlaintextEvaluator';

describe('PlainTextEvaluator', () => {
  test('extends Evaluator', () => {
    expect(Evaluator.prototype.isPrototypeOf(PlainTextEvaluator)).toBe(true);
  });

  describe('evalAST', () => {
    describe('when no AST is passed', () => {
      test('returns copyPrefix', () => {
        const copyPrefix = 'hello';

        expect(PlaintextEvaluator.evalAST(copyPrefix)).toBe(copyPrefix);
      });
    });

    describe('when an AST is passed', () => {
      describe('when the AST is simple and has no sibling', () => {
        describe('when the AST is a Newline', () => {
          test('returns a newline character', () => {
            const ast = new Newline();

            expect(PlaintextEvaluator.evalAST('', ast)).toBe('\n');
          });
        });

        describe('when the AST is a Verbatim', () => {
          test('returns a newline character', () => {
            const text = 'some really cool text';
            const ast = new Verbatim({ text });

            expect(PlaintextEvaluator.evalAST('', ast)).toBe(text);
          });
        });
      });
    });
  });
});
