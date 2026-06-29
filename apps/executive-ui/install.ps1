# Windows TLS: Node's bundled CA store may not include locally trusted roots
# (e.g. antivirus / SSL inspection). Use Windows certificate store for npm.
$env:NODE_OPTIONS = '--use-system-ca'
npm install @args
