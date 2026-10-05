/**
 * The resolve hook body, kept in its own file because module.register() runs it
 * on a separate loader thread. See esm-extensionless-resolve.mjs for usage.
 */
export async function resolve(specifier, context, next) {
  try {
    return await next(specifier, context);
  } catch (error) {
    if (specifier.startsWith('.') || specifier.startsWith('/')) {
      return next(`${specifier}.js`, context);
    }

    throw error;
  }
}
