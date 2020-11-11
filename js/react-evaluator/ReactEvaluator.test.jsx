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
  Verbatim,
  Substitutions,
  CopyService
} from '../index.js';

import ReactEvaluator from './ReactEvaluator';

describe('ReactEvaluator', () => {
  let evaluator, copyService, substitutions;

  beforeEach(() => {
    copyService = new CopyService();
    evaluator = new ReactEvaluator(copyService);

    substitutions = new Substitutions({});
    jest.spyOn(substitutions, 'get');
    jest.spyOn(substitutions, 'getBoolean');
  });

  describe('getInitialResult', () => {
    test('returns null', () => {
      expect(evaluator.getInitialResult()).toBeNull();
    });
  });

  describe('evalAST', () => {
    beforeEach(() => {
      jest.spyOn(copyService, 'getAstForKey');
    });

    const getStaticMarkup = (copyPrefix, ast) => (
      ReactDOMServer.renderToStaticMarkup(
        evaluator.evalAST(copyPrefix, ast, substitutions)
      )
    );

    describe('when no AST is passed', () => {
      test('returns copyPrefix', () => {
        const copyPrefix = <div>hello</div>;

        expect(evaluator.evalAST(copyPrefix, null)).toBe(copyPrefix);
      });
    });

    describe('when the ast is cached', () => {
      test('combines the cached result with the prefix', () => {
        const copyPrefix = 'hello';
        const suffix = <strong>world</strong>;
        const ast = new Newline({});

        jest.spyOn(evaluator, 'getCached').mockReturnValue(suffix);
        expect(getStaticMarkup(copyPrefix, ast)).toBe('hello<strong>world</strong>');
        expect(evaluator.getCached).toBeCalledWith(ast);
      });
    });

    describe('when the ast is not cached', () => {
      test('caches the fully evaluated ast, without the prefix', () => {
        const copyPrefix = <React.Fragment>hello</React.Fragment>;
        const ast = new Verbatim({
          text: 'world',
          sibling: new Verbatim({ text: '!' })
        });

        jest.spyOn(evaluator, 'setCacheIfCacheable');
        expect(getStaticMarkup(copyPrefix, ast)).toBe('helloworld!');
        expect(evaluator.setCacheIfCacheable).toBeCalledWith(ast, 'world!');
        expect(ReactDOMServer.renderToStaticMarkup(evaluator.getCached(ast))).toBe(
          'world!'
        );
      });
    });

    describe('when an AST is passed', () => {
      describe('when the AST is simple and has no sibling', () => {
        describe('when the AST is a Newline', () => {
          test('returns a span with a br element', () => {
            const ast = new Newline({});

            expect(getStaticMarkup(null, ast)).toBe('<br/>');
          });
        });

        describe('when the AST is a Verbatim', () => {
          test('returns the text from Verbatim as JSX', () => {
            const text = 'some really cool text';
            const ast = new Verbatim({ text });

            expect(getStaticMarkup(null, ast)).toBe(text);
          });
        });

        describe('when the AST is a Reference', () => {
          test('returns the evaluated copy of the referenced key', () => {
            const referencedAST = new Verbatim({ text: 'some text' });
            copyService.getAstForKey.mockReturnValue(referencedAST);

            const key = 'some.key';
            const ast = new Reference({ key });

            expect(getStaticMarkup(null, ast)).toBe(referencedAST.text);
          });
        });

        describe('when the AST is a Substitute', () => {
          describe('when the substitution is not found', () => {
            test('returns the copy prefix', () => {
              substitutions.get.mockReturnValue(null);
              const ast = new Substitute({ key: 'does.not.exist' });

              expect(evaluator.evalAST(null, ast, substitutions)).toBe(null);
            });
          });

          describe('when the substitution is found', () => {
            test('returns the substitution as a string formatted in JSX', () => {
              const text = 'substitution';
              substitutions.get.mockReturnValue(text);
              const ast = new Substitute({ key: 'exists' });

              expect(getStaticMarkup(null, ast)).toBe(text);
            });
          });

          describe('when the substitution is an empty string', () => {
            test('returns the copy prefix', () => {
              substitutions.get.mockReturnValue('');
              const ast = new Substitute({ key: 'exists' });

              expect(evaluator.evalAST(null, ast, substitutions)).toBe(null);
            });
          });
        });

        describe('when the AST is a RefSubstitute', () => {
          describe('when the substitution is not found', () => {
            test('returns copy prefix', () => {
              substitutions.get.mockReturnValue(null);
              const ast = new RefSubstitute({ key: 'does.not.exist' });

              expect(evaluator.evalAST(null, ast, substitutions)).toBe(null);
            });
          });

          describe('when the substitution is found', () => {
            test('returns the evaluated copy of the referenced key', () => {
              const referencedAST = new Verbatim({ text: 'some text' });
              copyService.getAstForKey.mockReturnValue(referencedAST);

              const key = 'some.key';
              const ast = new RefSubstitute({ key });

              expect(getStaticMarkup(null, ast)).toBe(referencedAST.text);
            });
          });
        });

        describe('when the AST is a Switch', () => {
          describe('when the decider is true', () => {
            test('returns the evaluated left AST of the Switch', () => {
              substitutions.getBoolean.mockReturnValue(true);
              const ast = new Switch({
                left: new Verbatim({ text: 'left text' }),
                right: new Verbatim({ text: 'right text' }),
                key: 'decider'
              });

              expect(getStaticMarkup(null, ast)).toBe(ast.left.text);
            });
          });

          describe('when the decider false', () => {
            test('returns the evaluated right AST of the Switch', () => {
              substitutions.getBoolean.mockReturnValue(false);
              const ast = new Switch({
                left: new Verbatim({ text: 'left text' }),
                right: new Verbatim({ text: 'right text' }),
                key: 'decider'
              });

              expect(getStaticMarkup(null, ast)).toBe(ast.right.text);
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

              evaluator.evalAST(null, ast, new Substitutions({ func }));
              expect(func).toBeCalledWith(ast.copy.text, 'arg1', 'arg2');
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
                getStaticMarkup(evaluator.evalAST(null, ast, new Substitutions({ func })))
              ).toBe(funcText);
            });

            describe('when allowFunctional is false on the evaluator', () => {
              beforeEach(() => {
                evaluator.allowFunctional = false;
              });

              test('returns the functional\'s evaluated copy without calling the function', () => {
                const funcText = 'func text';
                const func = jest.fn().mockReturnValue(funcText);

                const ast = new Functional({
                  key: 'func',
                  copy: new Verbatim({ text: 'some copy' }),
                  args: ['arg1', 'arg2']
                });

                expect(
                  getStaticMarkup(evaluator.evalAST(null, ast, new Substitutions({ func })))
                ).toBe(ast.copy.text);

                expect(func).not.toBeCalled();
              });
            });
          });

          describe('when the functional does not have a method', () => {
            test('returns the functional\'s evaluated copy', () => {
              const ast = new Functional({
                key: 'func',
                copy: new Verbatim({ text: 'some copy' }),
                args: ['arg1', 'arg2']
              });

              expect(getStaticMarkup(evaluator.evalAST(null, ast, substitutions))).toBe(
                ast.copy.text
              );
            });
          });
        });

        describe('when the AST is a Formatting', () => {
          test('returns the Formatting\'s HTML tag containing evaluated copy', () => {
            const ast = new Formatting({
              tag: 'em',
              copy: new Verbatim({ text: 'some copy' })
            });

            expect(getStaticMarkup(evaluator.evalAST(null, ast))).toBe(
              `<em>${ast.copy.text}</em>`
            );
          });

          describe('when the tag is empty', () => {
            test('returns the existing prefix', () => {
              const prefix = <React.Fragment>prefix</React.Fragment>;

              const ast = new Formatting({
                tag: 'em',
                copy: null
              });

              expect(getStaticMarkup(evaluator.evalAST(prefix, ast))).toBe(
                'prefix'
              );
            });
          });
        });

        describe('when the AST is an unknown AST class', () => {
          beforeEach(() => {
            jest.spyOn(evaluator, '_handleError').mockImplementation();
          });

          test('logs error', () => {
            evaluator.evalAST(null, {});
            expect(evaluator._handleError).toBeCalledWith('Unknown node detected');
          });

          test('returns null', () => {
            expect(evaluator.evalAST(null, {})).toBeNull();
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

            const substitutions = new Substitutions({
              initialDecider: true,
              nestedLeft: false,
              nestedRight: true
            });

            expect(
              getStaticMarkup(evaluator.evalAST(null, ast, substitutions))
            ).toBe(ast.left.right.text);
          });
        });

        describe('when several Verbatim nodes are siblings', () => {
          test('returns the correct copy', () => {
            const ast = new Verbatim({
              text: 'verbatim1',
              sibling: new Verbatim({
                text: 'verbatim2',
                sibling: new Verbatim({ text: 'verbatim3' })
              })
            });

            expect(getStaticMarkup(null, ast)).toBe('verbatim1verbatim2verbatim3');
          });
        });

        describe('when complex copy exists inside of an HTML tag', () => {
          test('returns the correct copy', () => {
            const ast = new Formatting({
              tag: 'strong',
              copy: new Formatting({
                tag: 'em',
                copy: new Switch({
                  left: new Verbatim({ text: 'rl' }),
                  right: new Verbatim({ text: 'rr' }),
                  key: 'nestedRight'
                })
              })
            });

            expect(getStaticMarkup(null, ast)).toBe('<strong><em>rr</em></strong>');
          });
        });
      });
    });
  });
});
