import React from 'react';
import ReactDOMServer from 'react-dom/server';

import {
  Formatting,
  Functional,
  Newline,
  Reference,
  RefSubstitute,
  Substitute,
  Switch,
  Verbatim
} from '@nextcapital/copy-service';

import ReactEvaluator from './ReactEvaluator';

describe('ReactEvaluator', () => {
  // Safety valve
  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('_getInitialResult', () => {
    test('returns null', () => {
      expect(ReactEvaluator._getInitialResult()).toBeNull();
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

    const getStaticMarkup = (copyPrefix, ast, getAST, substitutions) => (
      ReactDOMServer.renderToStaticMarkup(
        ReactEvaluator.evalAST(copyPrefix, ast, getAST, substitutions)
      )
    );

    describe('when no AST is passed', () => {
      test('returns copyPrefix', () => {
        const copyPrefix = <div>hello</div>;

        expect(ReactEvaluator.evalAST(copyPrefix)).toBe(copyPrefix);
      });
    });

    describe('when an AST is passed', () => {
      describe('when the AST is simple and has no sibling', () => {
        describe('when the AST is a Newline', () => {
          test('returns a span with a br element', () => {
            const ast = new Newline({});

            expect(getStaticMarkup(null, ast)).toBe('<span><br/></span>');
          });
        });

        describe('when the AST is a Verbatim', () => {
          test('returns the Verbatim\'s text in JSX', () => {
            const text = 'some really cool text';
            const ast = new Verbatim({ text });

            expect(getStaticMarkup(null, ast)).toBe(`<span>${text}</span>`);
          });
        });

        describe('when the AST is a Reference', () => {
          test('returns the evaluated copy of the referenced key', () => {
            const referencedAST = new Verbatim({ text: 'some text' });
            getASTForKey.mockReturnValue(referencedAST);

            const key = 'some.key';
            const ast = new Reference({ key });

            expect(getStaticMarkup(null, ast, getASTForKey)).toBe(
              `<span>${referencedAST.text}</span>`
            );
          });
        });

        describe('when the AST is a Substitute', () => {
          beforeEach(() => {
            jest.spyOn(ReactEvaluator, '_trySubstitution');
          });

          afterEach(() => {
            ReactEvaluator._trySubstitution.mockRestore();
          });

          describe('when the substitution is not found', () => {
            test('returns copy prefix', () => {
              ReactEvaluator._trySubstitution.mockReturnValue(null);
              const ast = new Substitute({ key: 'does.not.exist' });

              expect(ReactEvaluator.evalAST(null, ast, getASTForKey)).toBe(null);
            });
          });

          describe('when the substitution is found', () => {
            test('returns the substitution as a string formatted in JSX', () => {
              const text = 'substitution';
              ReactEvaluator._trySubstitution.mockReturnValue(text);
              const ast = new Substitute({ key: 'exists' });

              expect(getStaticMarkup(null, ast, getASTForKey)).toBe(`<span>${text}</span>`);
            });
          });
        });

        describe('when the AST is a RefSubstitute', () => {
          beforeEach(() => {
            jest.spyOn(ReactEvaluator, '_trySubstitution');
          });

          afterEach(() => {
            ReactEvaluator._trySubstitution.mockRestore();
          });

          describe('when the substitution is not found', () => {
            test('returns copy prefix', () => {
              ReactEvaluator._trySubstitution.mockReturnValue(null);
              const ast = new RefSubstitute({ key: 'does.not.exist' });

              expect(ReactEvaluator.evalAST(null, ast, getASTForKey)).toBe(null);
            });
          });

          describe('when the substitution is found', () => {
            test('returns the evaluated copy of the referenced key', () => {
              const referencedAST = new Verbatim({ text: 'some text' });
              getASTForKey.mockReturnValue(referencedAST);

              const key = 'some.key';
              const ast = new RefSubstitute({ key });

              expect(getStaticMarkup(null, ast, getASTForKey)).toBe(
                `<span>${referencedAST.text}</span>`
              );
            });
          });
        });

        describe('when the AST is a Switch', () => {
          beforeEach(() => {
            jest.spyOn(ReactEvaluator, '_trySubstitution');
          });

          afterEach(() => {
            ReactEvaluator._trySubstitution.mockRestore();
          });

          describe('when the decider is 1', () => {
            test('returns the evaluated left AST of the Switch', () => {
              ReactEvaluator._trySubstitution.mockReturnValue(1);
              const ast = new Switch({
                left: new Verbatim({ text: 'left text' }),
                right: new Verbatim({ text: 'right text' }),
                key: 'decider'
              });

              expect(getStaticMarkup(null, ast)).toBe(`<span>${ast.left.text}</span>`);
            });
          });

          describe('when the decider is true', () => {
            test('returns the evaluated left AST of the Switch', () => {
              ReactEvaluator._trySubstitution.mockReturnValue(true);
              const ast = new Switch({
                left: new Verbatim({ text: 'left text' }),
                right: new Verbatim({ text: 'right text' }),
                key: 'decider'
              });

              expect(getStaticMarkup(null, ast)).toBe(`<span>${ast.left.text}</span>`);
            });
          });

          describe('when the decider is neither 1 nor true', () => {
            test('returns the evaluated right AST of the Switch', () => {
              ReactEvaluator._trySubstitution.mockReturnValue(false);
              const ast = new Switch({
                left: new Verbatim({ text: 'left text' }),
                right: new Verbatim({ text: 'right text' }),
                key: 'decider'
              });

              expect(getStaticMarkup(null, ast)).toBe(`<span>${ast.right.text}</span>`);
            });
          });

          describe('when the decider is null', () => {
            test('returns the evaluated right AST of the Switch', () => {
              const ast = new Switch({
                left: new Verbatim({ text: 'left text' }),
                right: new Verbatim({ text: 'right text' }),
                key: 'decider'
              });

              expect(getStaticMarkup(null, ast)).toBe(`<span>${ast.right.text}</span>`);
            });
          });
        });

        describe('when the AST is a Functional', () => {
          describe('when the functional has a method', () => {
            test('evaluates the function', () => {
              const func = jest.fn();
              const ast = new Functional({
                key: 'func',
                copy: new Verbatim({ text: 'some copy' }),
                args: ['arg1', 'arg2']
              });

              ReactEvaluator.evalAST(null, ast, getASTForKey, { func });
              expect(func).toBeCalledWith(<span>{ ast.copy.text }</span>, 'arg1', 'arg2');
            });

            test('returns the result of the function method formatted as JSX', () => {
              const funcText = 'func text';
              const func = jest.fn().mockReturnValue(funcText);
              const ast = new Functional({
                key: 'func',
                copy: new Verbatim({ text: 'some copy' }),
                args: ['arg1', 'arg2']
              });

              expect(
                getStaticMarkup(ReactEvaluator.evalAST(null, ast, getASTForKey, { func }))
              ).toBe(`<span>${funcText}</span>`);
            });
          });

          describe('when the functional does not have a method', () => {
            test('returns the functional\'s evaluated copy', () => {
              const ast = new Functional({
                key: 'func',
                copy: new Verbatim({ text: 'some copy' }),
                args: ['arg1', 'arg2']
              });

              expect(getStaticMarkup(ReactEvaluator.evalAST(null, ast, getASTForKey))).toBe(
                `<span>${ast.copy.text}</span>`
              );
            });
          });
        });

        describe('when the AST is a Formatting', () => {
          test('returns the Formatting\'s HTML tag containing evaluated copy', () => {
            const ast = new Formatting({
              tag: 'i',
              copy: new Verbatim({ text: 'some copy' })
            });

            expect(getStaticMarkup(ReactEvaluator.evalAST(null, ast, getASTForKey))).toBe(
              `<span><i>${ast.copy.text}</i></span>`
            );
          });
        });

        describe('when the AST is an unknown AST class', () => {
          beforeEach(() => {
            jest.spyOn(ReactEvaluator, '_handleError').mockImplementation();
          });

          afterEach(() => {
            ReactEvaluator._handleError.mockRestore();
          });

          test('logs error', () => {
            ReactEvaluator.evalAST(null, {});
            expect(ReactEvaluator._handleError).toBeCalledWith('Unknown node detected');
          });

          test('returns null', () => {
            expect(ReactEvaluator.evalAST(null, {})).toBeNull();
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

            expect(getStaticMarkup(null, ast, getASTForKey, substitutions)).toBe(
              `<span>${ast.left.right.text}</span>`
            );
          });
        });

        describe('when several Verbatims are siblings', () => {
          test('returns the correct copy', () => {
            const ast = new Verbatim({
              text: 'verbatim1',
              sibling: new Verbatim({
                text: 'verbatim2',
                sibling: new Verbatim({ text: 'verbatim3' })
              })
            });

            expect(getStaticMarkup(null, ast)).toBe('<span>verbatim1verbatim2verbatim3</span>');
          });
        });

        describe('when complex copy exists inside of an HTML tag', () => {
          test('returns the correct copy', () => {
            const ast = new Formatting({
              tag: 'b',
              copy: new Formatting({
                tag: 'i',
                copy: new Switch({
                  left: new Verbatim({ text: 'rl' }),
                  right: new Verbatim({ text: 'rr' }),
                  key: 'nestedRight'
                })
              })
            });

            expect(getStaticMarkup(null, ast)).toBe('<span><b><i>rr</i></b></span>');
          });
        });
      });
    });
  });
});
