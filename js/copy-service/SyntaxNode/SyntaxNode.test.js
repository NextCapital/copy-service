const SyntaxNode = require('./SyntaxNode');

describe('SyntaxNode', () => {
  let syntaxNode;

  beforeEach(() => {
    syntaxNode = new SyntaxNode();
  });

  describe('static isAST', () => {
    describe('when null', () => {
      test('returns true', () => {
        expect(SyntaxNode.isAST(null)).toBe(true);
      });
    });

    describe('when a SyntaxNode', () => {
      test('returns true', () => {
        expect(SyntaxNode.isAST(syntaxNode)).toBe(true);
      });
    });

    describe('when something else', () => {
      test('returns true', () => {
        expect(SyntaxNode.isAST({})).toBe(false);
      });
    });
  });

  describe('static safeToSyntax', () => {
    describe('when null', () => {
      test('returns an empty string', () => {
        expect(SyntaxNode.safeToSyntax(null)).toBe('');
      });
    });

    describe('when a SyntaxNode', () => {
      test('returns the result of toSyntax', () => {
        const result = 'some result';
        jest.spyOn(syntaxNode, 'toSyntax').mockReturnValue(result);
        expect(SyntaxNode.safeToSyntax(syntaxNode)).toBe(result);
      });
    });
  });

  describe('toSyntax', () => {
    test('returns an empty string', () => {
      expect(syntaxNode.toSyntax()).toBe('');
    });
  });

  describe('safeToSyntax', () => {
    test('defers to the class method', () => {
      const result = 'some result';
      jest.spyOn(SyntaxNode, 'safeToSyntax').mockReturnValue(result);

      expect(syntaxNode.safeToSyntax(syntaxNode)).toBe(result);
      expect(SyntaxNode.safeToSyntax).toHaveBeenCalledWith(syntaxNode);
    });
  });

  describe('isCacheable', () => {
    test('returns false', () => {
      expect(syntaxNode.isCacheable()).toBe(false);
    });
  });
});
