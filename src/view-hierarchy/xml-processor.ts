import xslStylesheet from './xsl';

const VIEW_HIERARCHY_TAG_REGEX = /<ViewHierarchy/;

/**
 * Fluent XML builder for view hierarchy processing
 */
export class XmlBuilder {
  private readonly xml: string;
  private screenshot?: string;
  private activePointer?: string;
  private errorMessage?: string;
  private platform?: 'ios' | 'android';

  constructor(xml: string) {
    this.xml = xml;
  }

  /**
   * Add screenshot to the XML (accepts base64 string, adds data URL prefix)
   */
  withScreenshot(base64Screenshot?: string): this {
    if (base64Screenshot) {
      this.screenshot = `data:image/png;base64,${base64Screenshot}`;
    }
    return this;
  }

  /**
   * Add active pointer to the XML
   */
  withActivePointer(pointer: string | undefined): this {
    if (pointer) {
      this.activePointer = pointer;
    }

    return this;
  }

  /**
   * Add error message to the XML
   */
  withErrorMessage(message: string | undefined): this {
    this.errorMessage = message;
    return this;
  }

  /**
   * Add platform to the XML
   */
  withPlatform(platform: 'ios' | 'android' | undefined): this {
    if (platform) {
      this.platform = platform;
    }

    return this;
  }

  /**
   * Build and return the final XML string
   */
  toString(): string {
    let processedXml = this.injectAttributes(this.xml, {
      screenshot: this.screenshot,
      'active-ptr': this.activePointer,
      platform: this.platform,
    });

    if (this.errorMessage) {
      processedXml = this.injectErrorMessage(processedXml, this.errorMessage);
    }

    return this.injectXslStylesheet(processedXml);
  }

  /**
   * Inject attributes into the ViewHierarchy tag
   */
  private injectAttributes(xml: string, attrs: Record<string, string | undefined>): string {
    const attributes = Object.entries(attrs)
      .filter(([, value]) => value)
      .map(([key, value]) => `${key}="${value}"`)
      .join(' ');

    if (!attributes) {
      return xml;
    }

    return xml.replace(VIEW_HIERARCHY_TAG_REGEX, `$& ${attributes}`);
  }

  /**
   * Inject error message into the XML
   */
  private injectErrorMessage(xml: string, message: string): string {
    const errorMessage = `<ErrorMessage><![CDATA[${message}]]></ErrorMessage>`;
    return xml.replace('</ViewHierarchy>', `${errorMessage}</ViewHierarchy>`);
  }

  /**
   * Inject XSL stylesheet into XML to enable HTML visualization
   */
  private injectXslStylesheet(xmlContent: string): string {
    if (xmlContent.includes('<?xml-stylesheet')) {
      return xmlContent;
    }

    // Find the XML declaration and inject XSL stylesheet after it
    const xmlDeclarationMatch = xmlContent.match(/^<\?xml[^>]*\?>/);
    if (xmlDeclarationMatch) {
      const xslProcessingInstruction = `<?xml-stylesheet type="text/xsl" href="${xslStylesheet}"?>\n`;
      return xmlContent.replace(
        xmlDeclarationMatch[0],
        xmlDeclarationMatch[0] + '\n' + xslProcessingInstruction,
      );
    }

    return xmlContent;
  }
}
