import {
  Formatting,
  Functional,
  Newline,
  Reference,
  Substitute,
  Switch,
  Verbatim
} from '@nextcapital/copy-service';

import PlainTextEvaluator from './PlainTextEvaluator';

describe('PlainTextEvaluator', () => {
  // Safety valve
  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('_getInitialResult', () => {
    test('returns empty string', () => {
      expect(PlainTextEvaluator._getInitialResult()).toBe('');
    });
  });

  describe('evalAST', () => {
    let getASTForKey;

    beforeEach(() => {
      getASTForKey = jest.fn();
    });

    afterEach(() => {
      getASTForKey = null;
    });

    describe('when no AST is passed', () => {
      test('returns copyPrefix', () => {
        const copyPrefix = 'hello';

        expect(PlainTextEvaluator.evalAST(copyPrefix)).toBe(copyPrefix);
      });
    });

    describe('when an AST is passed', () => {
      describe('when the AST is simple and has no sibling', () => {
        describe('when the AST is a Newline', () => {
          test('returns a newline character', () => {
            const ast = new Newline({});

            expect(PlainTextEvaluator.evalAST('', ast)).toBe('\n');
          });
        });

        describe('when the AST is a Verbatim', () => {
          test('returns Verbatim\'s text', () => {
            const text = 'some really cool text';
            const ast = new Verbatim({ text });

            expect(PlainTextEvaluator.evalAST('', ast)).toBe(text);
          });
        });

        describe('when the AST is a Reference', () => {
          test('returns the evaluated copy from the referenced key', () => {
            const referencedAST = new Newline({});
            getASTForKey.mockReturnValue(referencedAST);

            const key = 'some.key';
            const ast = new Reference({ key });

            expect(PlainTextEvaluator.evalAST('', ast, getASTForKey)).toBe('\n');
          });
        });

        describe('when the AST is a Substitute', () => {
          beforeEach(() => {
            jest.spyOn(PlainTextEvaluator, '_trySubstitution');
          });

          afterEach(() => {
            PlainTextEvaluator._trySubstitution.mockRestore();
          });

          describe('when the substitution is not found', () => {
            test('returns empty string', () => {
              PlainTextEvaluator._trySubstitution.mockReturnValue(null);
              const ast = new Substitute({ key: 'does.not.exist' });

              expect(PlainTextEvaluator.evalAST('', ast, getASTForKey)).toBe('');
            });
          });

          describe('when the substitution is found', () => {
            test('returns the substitution as a string', () => {
              const text = 'substitution';
              PlainTextEvaluator._trySubstitution.mockReturnValue(text);
              const ast = new Substitute({ key: 'exists' });

              expect(PlainTextEvaluator.evalAST('', ast, getASTForKey)).toBe(text);
            });
          });
        });

        describe('when the AST is a Switch', () => {
          beforeEach(() => {
            jest.spyOn(PlainTextEvaluator, '_trySubstitution');
          });

          afterEach(() => {
            PlainTextEvaluator._trySubstitution.mockRestore();
          });

          describe('when the decider is 1', () => {
            test('returns the evaluated left AST of the Switch', () => {
              PlainTextEvaluator._trySubstitution.mockReturnValue(1);
              const ast = new Switch({
                left: new Verbatim({ text: 'left text' }),
                right: new Verbatim({ text: 'right text' }),
                key: 'decider'
              });

              expect(PlainTextEvaluator.evalAST('', ast)).toBe(ast.left.text);
            });
          });

          describe('when the decider is true', () => {
            test('returns the evaluated left AST of the Switch', () => {
              PlainTextEvaluator._trySubstitution.mockReturnValue(true);
              const ast = new Switch({
                left: new Verbatim({ text: 'left text' }),
                right: new Verbatim({ text: 'right text' }),
                key: 'decider'
              });

              expect(PlainTextEvaluator.evalAST('', ast)).toBe(ast.left.text);
            });
          });

          describe('when the decider is neither 1 nor true', () => {
            test('returns the evaluated right AST of the Switch', () => {
              PlainTextEvaluator._trySubstitution.mockReturnValue(false);
              const ast = new Switch({
                left: new Verbatim({ text: 'left text' }),
                right: new Verbatim({ text: 'right text' }),
                key: 'decider'
              });

              expect(PlainTextEvaluator.evalAST('', ast)).toBe(ast.right.text);
            });
          });

          describe('when the decider is null', () => {
            test('returns the evaluated right AST of the Switch', () => {
              const ast = new Switch({
                left: new Verbatim({ text: 'left text' }),
                right: new Verbatim({ text: 'right text' }),
                key: 'decider'
              });

              expect(PlainTextEvaluator.evalAST('', ast)).toBe(ast.right.text);
            });
          });
        });

        describe('when the AST is a Functional', () => {
          test('returns the evaluated copy of the Functional, ignoring the function itself', () => {
            const ast = new Functional({
              copy: new Verbatim({ text: 'functional text' }),
              key: 'functionKey'
            });

            expect(PlainTextEvaluator.evalAST('', ast)).toBe(ast.copy.text);
          });
        });

        describe('when the AST is a Formatting', () => {
          test('returns the evaluated copy of the Formatting, ignoring the HTML tags', () => {
            const ast = new Formatting({
              copy: new Verbatim({ text: 'functional text' }),
              tag: 'b'
            });

            expect(PlainTextEvaluator.evalAST('', ast)).toBe(ast.copy.text);
          });
        });

        describe('when the AST is not a known AST class', () => {
          beforeEach(() => {
            jest.spyOn(PlainTextEvaluator, '_handleError').mockImplementation();
          });

          afterEach(() => {
            PlainTextEvaluator._handleError.mockRestore();
          });

          test('logs error', () => {
            PlainTextEvaluator.evalAST('', {});
            expect(PlainTextEvaluator._handleError).toBeCalledWith('Unknown node detected');
          });

          test('returns empty string', () => {
            expect(PlainTextEvaluator.evalAST('', {})).toBe('');
          });
        });
      });

      describe('when the AST is complex and has siblings', () => {
        describe('when the AST is a nested Switch', () => {
          test('returns the correct copy', () => {
            const ast = new Switch({
              left: new Switch({
                left: new Verbatim({ text: 'll' }),
                right: new Verbatim({ text: 'lr' }),
                key: 'nestedLeft'
              }),
              right: new Switch({
                left: new Verbatim({ text: 'rl' }),
                right: new Verbatim({ text: 'rr' }),
                key: 'nestedRight'
              }),
              key: 'initialDecider'
            });
            const substitutions = {
              initialDecider: true,
              nestedLeft: false,
              nestedRight: true
            };

            expect(PlainTextEvaluator.evalAST('', ast, getASTForKey, substitutions)).toBe(
              ast.left.right.text
            );
          });
        });
      });
    });
  });
});
