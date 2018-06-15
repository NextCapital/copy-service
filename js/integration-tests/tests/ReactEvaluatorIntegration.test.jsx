import React from 'react';
import ReactDOMServer from 'react-dom/server';

import { CopyService } from '@nextcapital/copy-service';
import ReactEvaluator from '@nextcapital/react-evaluator';

import copy from '../copy';

describe('CopyService - ReactEvaluator Integration Tests', () => {
  let copyService;

  beforeEach(() => {
    copyService = new CopyService({
      copy,
      evaluator: ReactEvaluator
    });
  });

  afterEach(() => {
    copyService = null;

    jest.restoreAllMocks();
  });

  const getStaticMarkup = (jsx) => ReactDOMServer.renderToStaticMarkup(jsx);

  const testCopy = ({
    key,
    substitutions,
    expectedCopy
  }) => {
    test('returns the expected copy', () => {
      const staticMarkup = getStaticMarkup(copyService.getCopy(key, substitutions));
      expect(staticMarkup).toBe(expectedCopy);
    });
  };

  describe('simple copy with no more than one formatting symbol', () => {
    describe('noCopy', () => {
      test('returns null', () => {
        expect(copyService.getCopy('noCopy')).toBeNull();
      });
    });

    describe('verbatim copy', () => {
      describe('verbatim.balance', () => {
        testCopy({
          key: 'verbatim.balance',
          expectedCopy: '<span>Balance</span>'
        });
      });

      describe('verbatim.pluralTitle', () => {
        testCopy({
          key: 'verbatim.pluralTitle',
          expectedCopy: '<span>accounts</span>'
        });
      });

      describe('verbatim.owner', () => {
        testCopy({
          key: 'verbatim.owner',
          expectedCopy: '<span>Account Owner</span>'
        });
      });

      describe('verbatim.nameOnAccount', () => {
        testCopy({
          key: 'verbatim.nameOnAccount',
          expectedCopy: '<span>name on account</span>'
        });
      });

      describe('verbatim.list.title.primary', () => {
        testCopy({
          key: 'verbatim.list.title.primary',
          expectedCopy: '<span>accounts</span>'
        });
      });
    });

    describe('copy with substitutions', () => {
      describe('substitutions.title', () => {
        testCopy({
          key: 'substitutions.title',
          substitutions: { designObject: { members: { nickname: { faceValue: 'faceValue' } } } },
          expectedCopy: '<span>faceValue</span>'
        });
      });

      describe('substitutions.symbol', () => {
        testCopy({
          key: 'substitutions.symbol',
          substitutions: { value: 100 },
          expectedCopy: '<span>$100</span>'
        });
      });

      describe('substitutions.min', () => {
        testCopy({
          key: 'substitutions.min',
          substitutions: { value: 100 },
          expectedCopy: '<span>input value must be no earlier than 100</span>'
        });
      });
    });

    describe('copy with references to other pieces of copy', () => {
      describe('references.title', () => {
        testCopy({
          key: 'references.title',
          expectedCopy: '<span>Balance and accounts</span>'
        });
      });

      describe('references.symbol', () => {
        testCopy({
          key: 'references.symbol',
          substitutions: { value: 100 },
          expectedCopy: '<span>$100</span>'
        });
      });

      describe('references.owner', () => {
        testCopy({
          key: 'references.owner',
          expectedCopy: '<span>Account Owner</span>'
        });
      });
    });

    describe('copy with copy key substitutions', () => {
      describe('referenceSubstitutions.title', () => {
        testCopy({
          key: 'referenceSubstitutions.title',
          substitutions: { substitution: 'verbatim.balance' },
          expectedCopy: '<span>Balance</span>'
        });
      });
    });

    describe('copy with a decision branch', () => {
      describe('decisions.title', () => {
        describe('when the decider evaluates to true', () => {
          testCopy({
            key: 'decisions.title',
            substitutions: { designObject: { current: true } },
            expectedCopy: '<span>Current asset</span>'
          });
        });

        describe('when the decider evaluates to 1', () => {
          testCopy({
            key: 'decisions.title',
            substitutions: { designObject: { current: 1 } },
            expectedCopy: '<span>Current asset</span>'
          });
        });

        describe('when the decider evaluates to false', () => {
          testCopy({
            key: 'decisions.title',
            substitutions: { designObject: { current: false } },
            expectedCopy: '<span>Proposed asset</span>'
          });
        });

        describe('when the decider evaluates to an non-1 number', () => {
          testCopy({
            key: 'decisions.title',
            substitutions: { designObject: { current: 0 } },
            expectedCopy: '<span>Proposed asset</span>'
          });

          testCopy({
            key: 'decisions.title',
            substitutions: { designObject: { current: 400 } },
            expectedCopy: '<span>Proposed asset</span>'
          });
        });
      });

      describe('decisions.space', () => {
        describe('when the decider evaluates to true', () => {
          testCopy({
            key: 'decisions.space',
            substitutions: { relative: true },
            expectedCopy: '<span>contribution rate</span>'
          });
        });

        describe('when the decider evaluates to false', () => {
          testCopy({
            key: 'decisions.space',
            substitutions: { relative: false },
            expectedCopy: '<span>contribution</span>'
          });
        });
      });
    });

    describe('copy with a function', () => {
      describe('with no arguments', () => {
        describe('functions.title', () => {
          test('calls the passed function with the evaluated copy', () => {
            const passedFunction = jest.fn();
            copyService.getCopy('functions.title', { makeExternalLink: passedFunction });
            expect(passedFunction).toBeCalledWith(<span>learn more</span>);
          });

          test('returns the result of the function', () => {
            const funcResult = 'some result';
            const passedFunction = jest.fn().mockReturnValue(funcResult);


            const staticMarkup = getStaticMarkup(
              copyService.getCopy('functions.title', { makeExternalLink: passedFunction })
            );
            expect(staticMarkup).toBe(`<span>${funcResult}</span>`);
          });
        });
      });

      describe('with arguments', () => {
        describe('functions.args', () => {
          test('calls the passed function with the evaluated copy', () => {
            const passedFunction = jest.fn();
            const substitutions = {
              func: passedFunction,
              arg1: 'arg1',
              arg2: 'arg2'
            };
            copyService.getCopy('functions.args', substitutions);
            expect(passedFunction).toBeCalledWith(
              <span>learn more</span>, substitutions.arg1, substitutions.arg2
            );
          });

          test('returns the result of the function', () => {
            const funcResult = 'some result';
            const passedFunction = jest.fn().mockReturnValue(funcResult);
            const substitutions = {
              func: passedFunction,
              arg1: 'arg1',
              arg2: 'arg2'
            };

            const staticMarkup = getStaticMarkup(
              copyService.getCopy('functions.args', substitutions)
            );
            expect(staticMarkup).toBe(`<span>${funcResult}</span>`);
          });
        });
      });
    });
  });

  describe('copy with multiple and/or nested formatting symbols', () => {
    describe('copy in tags with a reference to copy with a substitution', () => {
      describe('tags.nestedReference', () => {
        testCopy({
          key: 'tags.nestedReference',
          substitutions: { value: 100 },
          expectedCopy: '<span><b><i>$100</i></b></span>'
        });
      });
    });

    describe('copy with a decision branch with nested formatting', () => {
      describe('decisions.nested', () => {
        describe('when the decider evaluates to true', () => {
          testCopy({
            key: 'decisions.nested',
            substitutions: {
              decider: true,
              sub: 'some sub',
              value: 100
            },
            expectedCopy: '<span><b><i>$100</i></b></span>'
          });
        });

        describe('when the decider evaluates to false', () => {
          testCopy({
            key: 'decisions.nested',
            substitutions: {
              decider: false,
              sub: 'some sub',
              value: 100
            },
            expectedCopy: '<span>some sub</span>'
          });
        });
      });
    });
  });
});
