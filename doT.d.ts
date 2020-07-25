declare namespace doT {
  type Encoder = (data: any) => string

  interface TemplateSettings {
    argName: string
    encoders: {
      [key: string]: Encoder
    }
    selfContained: boolean
    stripWhitespace: boolean
    internalPrefix: string
    encodersPrefix: string
  }

  interface Definitions {
    [key: string]: string | Function | any
  }

  type TemplateFunction = (data: any) => string

  function template(
    tmpl: string,
    cfg?: Partial<TemplateSettings>,
    def?: Definitions
  ): TemplateFunction

  function compile(tmpl: string, def?: Definitions): TemplateFunction
}

export = doT
