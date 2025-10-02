import { XmlBuilder } from './xml-processor';

// Simple XML for testing
const SIMPLE_XML = '<?xml version="1.0"?><ViewHierarchy><TestNode/></ViewHierarchy>';

describe('XmlBuilder', () => {
  let result: XmlBuilder;

  beforeEach(() => {
    result = new XmlBuilder(SIMPLE_XML).withStylesheet(false);
  });

  describe('withScreenshot', () => {
    it('should add screenshot attribute when provided', () => {
      expect(result.withScreenshot('test-base64-data').toString()).toMatchSnapshot();
    });

    it('should delete screenshot attribute when provided with undefined', () => {
      expect(
        result
          .withScreenshot('test-base64-data')
          .withScreenshot(void 0)
          .toString(),
      ).toEqual(SIMPLE_XML);
    });
  });

  describe('withActivePointer', () => {
    it('should add active-ptr attribute when provided', () => {
      expect(result.withActivePointer('0xdeadbeef').toString()).toMatchSnapshot();
    });

    it('should delete active-ptr attribute when provided with undefined', () => {
      expect(
        result
          .withActivePointer('0xdeadbeef')
          .withActivePointer(void 0)
          .toString(),
      ).toEqual(SIMPLE_XML);
    });
  });

  describe('withErrorMessage', () => {
    it('should add error message when provided', () => {
      expect(result.withErrorMessage('Test error message').toString()).toMatchSnapshot();
    });

    it('should not add error message when provided with undefined', () => {
      expect(
        result
          .withErrorMessage('Test error')
          .withErrorMessage(void 0)
          .toString(),
      ).toEqual(SIMPLE_XML);
    });
  });

  describe('withPlatform', () => {
    it('should add platform attribute when provided', () => {
      expect(result.withPlatform('ios').toString()).toMatchSnapshot();
    });

    it('should delete platform attribute when provided with undefined', () => {
      expect(
        result
          .withPlatform('android')
          .withPlatform(void 0)
          .toString(),
      ).toEqual(SIMPLE_XML);
    });
  });

  describe('withStylesheet', () => {
    it('should add custom stylesheet (URL) when provided', () => {
      const customStylesheet = 'custom-stylesheet.xsl';
      expect(result.withStylesheet(customStylesheet).toString()).toMatchSnapshot();
    });

    it('should add custom stylesheet (data URI) when provided', () => {
      const customStylesheet = 'data:application/xml;charset=utf-8,custom-stylesheet.xsl';
      expect(result.withStylesheet(customStylesheet).toString()).toMatchSnapshot();
    });

    it('should add custom stylesheet (inline) when provided', () => {
      const customStylesheet =
        '<?xml version="1.0" encoding="utf-8"?><xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform"><xsl:template match="/"><div>Hello World</div></xsl:template></xsl:stylesheet>';
      expect(result.withStylesheet(customStylesheet).toString()).toMatchSnapshot();
    });

    it('should remove stylesheet when provided with false', () => {
      expect(result.withStylesheet(false).toString()).toEqual(SIMPLE_XML);
    });

    it('should remove stylesheet when provided with null', () => {
      expect(result.withStylesheet(null).toString()).toEqual(SIMPLE_XML);
    });

    it('should remove stylesheet when provided with empty string', () => {
      expect(result.withStylesheet('').toString()).toEqual(SIMPLE_XML);
    });

    it('should restore stylesheet to default when provided with undefined', () => {
      expect(
        result
          .withStylesheet(false)
          .withStylesheet(void 0)
          .toString(),
      ).toMatch(/xml-stylesheet/m);
    });

    it('should restore stylesheet to default when provided with true', () => {
      expect(result.withStylesheet(false).withStylesheet(true).toString()).toMatch(
        /xml-stylesheet/m,
      );
    });
  });

  describe('Integration tests', () => {
    it('should handle all methods combined with complex XML', () => {
      const complexXml = `<?xml version="1.0"?>
<ViewHierarchy>
  <UIView>
    <UILabel text="Hello World"/>
    <UIButton title="Click Me"/>
  </UIView>
</ViewHierarchy>`;

      const builder = new XmlBuilder(complexXml)
        .withScreenshot(
          'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
        )
        .withActivePointer('0x12345678')
        .withErrorMessage('Test failed with multiple errors')
        .withPlatform('ios')
        .withStylesheet('custom-test.xsl');

      expect(builder.toString()).toMatchSnapshot();
    });

    it('should handle chaining and overriding values', () => {
      const result = new XmlBuilder(SIMPLE_XML)
        .withScreenshot('first-screenshot')
        .withActivePointer('0x11111111')
        .withPlatform('android')
        .withErrorMessage('First error')
        .withScreenshot('second-screenshot') // Override
        .withActivePointer('0x22222222') // Override
        .withPlatform('ios') // Override
        .withErrorMessage('Second error') // Override
        .withStylesheet('final-stylesheet.xsl');

      expect(result.toString()).toMatchSnapshot();
    });

    it('should handle edge cases with empty and null values', () => {
      const result = new XmlBuilder(SIMPLE_XML)
        .withScreenshot('')
        .withActivePointer('')
        .withPlatform(void 0)
        .withErrorMessage('')
        .withStylesheet(null);

      expect(result.toString()).toEqual(SIMPLE_XML);
    });
  });
});
