import CopyService from '../../js/index.js';
import PlainTextEvaluator from '../../PlainTextEvaluator';

import copy from '../copy';

describe('CopyService - PlainTextEvaluator Integration Tests', () => {
  let copyService, evaluator;

  beforeEach(() => {
    copyService = new CopyService({ copy });
    evaluator = new PlainTextEvaluator(copyService);
  });

  const testCopy = ({
    key,
    substitutions,
    expectedCopy
  }) => {
    test('returns the expected copy', () => {
      expect(evaluator.getCopy(key, substitutions)).toBe(expectedCopy);
    });
  };

  describe('simple copy with no more than one formatting symbol', () => {
    describe('noCopy', () => {
      testCopy({
        key: 'noCopy',
        expectedCopy: ''
      });
    });

    describe('verbatim copy', () => {
      describe('verbatim.balance', () => {
        testCopy({
          key: 'verbatim.balance',
          expectedCopy: 'Balance'
        });
      });

      describe('verbatim.pluralTitle', () => {
        testCopy({
          key: 'verbatim.pluralTitle',
          expectedCopy: 'accounts'
        });
      });

      describe('verbatim.owner', () => {
        testCopy({
          key: 'verbatim.owner',
          expectedCopy: 'Account Owner'
        });
      });

      describe('verbatim.nameOnAccount', () => {
        testCopy({
          key: 'verbatim.nameOnAccount',
          expectedCopy: 'name on account'
        });
      });

      describe('verbatim.list.title.primary', () => {
        testCopy({
          key: 'verbatim.list.title.primary',
          expectedCopy: 'accounts'
        });
      });
    });

    describe('copy with substitutions', () => {
      describe('substitutions.title', () => {
        testCopy({
          key: 'substitutions.title',
          substitutions: { designObject: { members: { nickname: { faceValue: 'faceValue' } } } },
          expectedCopy: 'faceValue'
        });
      });

      describe('substitutions.symbol', () => {
        testCopy({
          key: 'substitutions.symbol',
          substitutions: { value: 100 },
          expectedCopy: '$100'
        });
      });

      describe('substitutions.min', () => {
        testCopy({
          key: 'substitutions.min',
          substitutions: { value: 100 },
          expectedCopy: 'input value must be no earlier than 100'
        });
      });
    });

    describe('copy with references to other pieces of copy', () => {
      describe('references.title', () => {
        testCopy({
          key: 'references.title',
          expectedCopy: 'Balance and accounts'
        });
      });

      describe('references.symbol', () => {
        testCopy({
          key: 'references.symbol',
          substitutions: { value: 100 },
          expectedCopy: '$100'
        });
      });

      describe('references.owner', () => {
        testCopy({
          key: 'references.owner',
          expectedCopy: 'Account Owner'
        });
      });
    });

    describe('copy with copy key substitutions', () => {
      describe('referenceSubstitutions.title', () => {
        testCopy({
          key: 'referenceSubstitutions.title',
          substitutions: { substitution: 'verbatim.balance' },
          expectedCopy: 'Balance'
        });
      });
    });

    describe('copy with a decision branch', () => {
      describe('decisions.title', () => {
        describe('when the decider evaluates to true', () => {
          testCopy({
            key: 'decisions.title',
            substitutions: { designObject: { current: true } },
            expectedCopy: 'Current asset'
          });
        });

        describe('when the decider evaluates to 1', () => {
          testCopy({
            key: 'decisions.title',
            substitutions: { designObject: { current: 1 } },
            expectedCopy: 'Current asset'
          });
        });

        describe('when the decider evaluates to false', () => {
          testCopy({
            key: 'decisions.title',
            substitutions: { designObject: { current: false } },
            expectedCopy: 'Proposed asset'
          });
        });

        describe('when the decider evaluates to an non-1 number', () => {
          testCopy({
            key: 'decisions.title',
            substitutions: { designObject: { current: 0 } },
            expectedCopy: 'Proposed asset'
          });

          testCopy({
            key: 'decisions.title',
            substitutions: { designObject: { current: 400 } },
            expectedCopy: 'Proposed asset'
          });
        });
      });

      describe('decisions.space', () => {
        describe('when the decider evaluates to true', () => {
          testCopy({
            key: 'decisions.space',
            substitutions: { relative: true },
            expectedCopy: 'contribution rate'
          });
        });

        describe('when the decider evaluates to false', () => {
          testCopy({
            key: 'decisions.space',
            substitutions: { relative: false },
            expectedCopy: 'contribution'
          });
        });
      });
    });

    describe('copy with a function', () => {
      describe('with no arguments', () => {
        describe('functions.title', () => {
          testCopy({
            key: 'functions.title',
            substitutions: { makeExternalLink: jest.fn() },
            expectedCopy: 'learn more'
          });

          test('does not call the passed function', () => {
            const passedFunction = jest.fn();
            evaluator.getCopy('functions.title', { makeExternalLink: passedFunction });
            expect(passedFunction).not.toBeCalled();
          });
        });
      });

      describe('with arguments', () => {
        describe('functions.args', () => {
          testCopy({
            key: 'functions.args',
            substitutions: {
              func: jest.fn(),
              arg1: 'arg1',
              arg2: 'arg2'
            },
            expectedCopy: 'learn more'
          });

          test('does not call the passed function', () => {
            const passedFunction = jest.fn();
            const substitutions = {
              func: passedFunction,
              arg1: 'arg1',
              arg2: 'arg2'
            };

            evaluator.getCopy('functions.args', substitutions);
            expect(passedFunction).not.toBeCalled();
          });
        });
      });
    });

    describe('copy with HTML tags', () => {
      describe('tags.title', () => {
        testCopy({
          key: 'tags.title',
          expectedCopy: 'Plan'
        });
      });

      describe('tags.nested', () => {
        testCopy({
          key: 'tags.nested',
          expectedCopy: 'Plan'
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
          expectedCopy: '$100'
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
            expectedCopy: '$100'
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
            expectedCopy: 'some sub'
          });
        });
      });
    });
  });
});
