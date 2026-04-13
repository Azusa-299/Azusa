declare module '*.yaml' {
  const messages: Record<string, any>
  export default messages
}

declare module '*.yml' {
  const messages: Record<string, any>
  export default messages
}
