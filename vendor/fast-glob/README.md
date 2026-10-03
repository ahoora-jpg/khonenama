# Build glob adapter

Replaces the single fast-glob consumer in the Vinext build dependency chain:
vite-plugin-commonjs -> vite-plugin-dynamic-import -> fast-glob -> micromatch -> braces.
The installed dynamic-import plugin calls only `sync(patterns, { cwd })`.
Tinyglobby supplies the same file discovery operation without depending on braces.
This removes GHSA-vfj7-8cjw-p6xm from the dependency graph rather than suppressing audit.

This is a scoped adapter, not a complete fast-glob implementation. Additional
consumers/options must be reviewed before extending it. Tests cover brace extension
patterns, recursive imports, ignores, async operation and rejected unsupported options.

References:
- https://github.com/vite-plugin/vite-plugin-dynamic-import/blob/main/src/index.ts
- https://github.com/SuperchupuDev/tinyglobby
- https://github.com/advisories/GHSA-vfj7-8cjw-p6xm
