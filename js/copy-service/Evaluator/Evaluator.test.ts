import Evaluator from './Evaluator';
import Substitutions from '../Substitutions/Substitutions';
import CopyService from '../CopyService';
import ErrorHandler from '../ErrorHandler/ErrorHandler';
import SyntaxNode from '../SyntaxNode/SyntaxNode';

describe('Evaluator', () => {
  let evaluator: Evaluator, copyService: CopyService;

  beforeEach(() => {
    copyService = new CopyService();
    evaluator = new Evaluator(copyService);
  });

  describe('constructor', () => {
    test('sets the copy service', () => {
      expect(evaluator.copyService).toBe(copyService);
    });

    test('creates the evaluationCache', () => {
      expect(evaluator.evaluationCache).toBeInstanceOf(WeakMap);
    });

    test('defaults allowFunctional to true', () => {
      expect(evaluator.allowFunctional).toBe(true);
    });

    describe('when allowFunctional is passed', () => {
      test('sets allowFunctional from options', () => {
        evaluator = new Evaluator(copyService, { allowFunctional: false });
        expect(evaluator.allowFunctional).toBe(false);
      });
    });
  });

  describe('getCached', () => {
    test('gets the result from the evaluation cache', () => {
      const result = { some: 'result' };
      const ast = new SyntaxNode();

      evaluator.evaluationCache.set(ast, result);
      expect(evaluator.getCached(ast)).toBe(result);
    });
  });

  describe('setCacheIfCacheable', () => {
    let result: object;

    beforeEach(() => {
      result = { some: 'result' };
    });

    describe('when the ast is cacheable', () => {
      test('sets the result in the cache', () => {
        const ast = new SyntaxNode();
        jest.spyOn(ast, 'isCacheable').mockReturnValue(true);

        evaluator.setCacheIfCacheable(ast, result);
        expect(evaluator.getCached(ast)).toBe(result);
        expect(ast.isCacheable).toHaveBeenCalledWith(copyService);
      });
    });

    describe('when the ast is not cacheable', () => {
      test('does not set the result in the cache', () => {
        const ast = new SyntaxNode();
        jest.spyOn(ast, 'isCacheable').mockReturnValue(false);

        evaluator.setCacheIfCacheable(ast, result);
        expect(evaluator.getCached(ast)).toBeUndefined();
        expect(ast.isCacheable).toHaveBeenCalledWith(copyService);
      });
    });
  });

  describe('getCopy', () => {
    test('defers to evalAST with correct args', () => {
      const key = 'some.copy.key';
      const rawSubstitutions = { some: 'raw', substitutions: 'yo' };

      const initialCopy = 'initialCopy';
      const ast = new SyntaxNode();

      jest.spyOn(copyService, 'getAstForKey').mockReturnValue(ast);
      jest.spyOn(evaluator, 'getInitialResult').mockReturnValue(initialCopy);

      const copy = 'result copy';
      jest.spyOn(evaluator, 'evalAST').mockImplementation(() => copy);

      expect(evaluator.getCopy(key, rawSubstitutions)).toBe(copy);
      expect(
        evaluator.evalAST
      ).toHaveBeenCalledWith(initialCopy, ast, new Substitutions(rawSubstitutions));
      expect(copyService.getAstForKey).toHaveBeenCalledWith(key);
      expect(evaluator.getInitialResult).toHaveBeenCalled();
    });
  });

  describe('evalAST', () => {
    test('throws error', () => {
      expect(
        () => evaluator.evalAST('prefix', new SyntaxNode(), new Substitutions({}))
      ).toThrow(
        'evalAST is abstract and must be implemented by the extending class'
      );
    });
  });

  describe('getInitialResult', () => {
    test('throws error', () => {
      expect(() => evaluator.getInitialResult()).toThrow(
        'getInitialResult is abstract and must be implemented by the extending class'
      );
    });
  });

  describe('_handleError', () => {
    test('defers to ErrorHandler.handleError', () => {
      const message = 'some error message';
      const options = { halt: true };
      jest.spyOn(ErrorHandler, 'handleError').mockImplementation();
      evaluator._handleError(message, options);
      expect(ErrorHandler.handleError).toHaveBeenCalledWith(Evaluator.name, message, options);
    });
  });
});
