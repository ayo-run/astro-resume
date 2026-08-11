# Security Policy

## Supported versions

| Version | Supported |
| --- | --- |
| 1.x | ✅ |
| 0.x | ❌ |

Fixes land on the latest 1.x release. There are no backports to 0.x.

**If you are on 0.x, upgrade.** Every published 0.x version writes serialized
data to the page without escaping `<`, so data containing `</script>` can break
out of the element and run as HTML. `1.0.0` fixed this, and its only breaking
change is a TypeScript one, so the upgrade is cheap. See
[Escaping & XSS](README.md#escaping--xss).

## Reporting a vulnerability

Please report security issues privately, not as a public issue:

- [Open a private security advisory][advisory] on GitHub — preferred, as it
  keeps the report and the fix in one place.
- Or email <ayo@ayco.io>.

You can expect an acknowledgement within five working days. If a report is
valid, you will get an estimated fix date and credit in the advisory unless you
would rather stay anonymous.

[advisory]: https://github.com/ayo-run/astro-resume/security/advisories/new

## Scope

This package serializes server-side data into a `<script type="application/json">`
element and reads it back on the client. The security-relevant surface is
therefore small and specific.

**In scope:**

- Any way to break out of the `<script>` element that `Serialize` writes — that
  is, a payload reaching the page unescaped through the default serializer.
- `deserialize()` returning data from an element other than the one requested.

**Known gap — reports still welcome:**

- **A custom serializer passed as `use` is not escaped for you.** Its return
  value is written to the page unchanged, so a serializer that does not escape
  `<` can break out of the `<script>` element. This is documented under
  [Escaping & XSS][xss], and `devalue` — the serializer the docs recommend —
  escapes correctly. Documentation is not a fix, though: `use` reads as a
  serializer choice rather than as opting out of an XSS defence, and nothing
  warns at runtime. Treat this as a gap that is intended to close, not as
  settled design.

**Out of scope:**

- **Data you pass to `Serialize` is published to the page.** Putting data on the
  page is what the component is for. It does not filter secrets; anything handed
  to it is visible to anyone who views the source.

[xss]: README.md#escaping--xss
