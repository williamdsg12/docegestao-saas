export class MessageTemplates {
  fill(template: string, vars: Record<string, any>): string {
    if (!template) return ''
    return template.replace(/\{(\w+)\}/g, (_, key) =>
      vars[key] !== undefined && vars[key] !== null ? String(vars[key]) : `{${key}}`
    )
  }
}
