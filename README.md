# Astro Resume

[![Package information: NPM version](https://img.shields.io/npm/v/@ayco/astro-resume)](https://www.npmjs.com/package/@ayco/astro-resume)
[![Package information: NPM license](https://img.shields.io/npm/l/@ayco/astro-resume)](https://www.npmjs.com/package/@ayco/astro-resume)
[![Package information: NPM downloads](https://img.shields.io/npm/dt/@ayco/astro-resume)](https://www.npmjs.com/package/@ayco/astro-resume)

> [!Note]
> **⚠️ Breaking change in v1** — `deserialize<T>` now defaults to `unknown` instead of `any`, so a call without a type argument no longer type-checks when you read properties off the result. See [Upgrading to v1](#upgrading-to-v1).

Utilities for serializing data from the server for use in the client.

1. `Serialize` - Astro component that takes `id` and `data`
1. `deserialize()` - a function for use in the client that takes an `id` string and returns the `data` object

## Install via npm

On your [Astro](https://astro.build) project:

```
npm i @ayco/astro-resume
```

Requires Astro 4 or newer.

## Usage

Serializing and deserializing basic primitive data

```astro
---
import Serialize from "@ayco/astro-resume";

const data = {
	hello: 'world',
}
---

<Serialize id="my-data" data={data} />

<script>
import {deserialize} from '@ayco/astro-resume';
const data = deserialize('my-data');
console.log(data) // {hello: 'world'}
</script>

```

Without a type argument `data` is `unknown` — enough to log it or pass it along, but not to read properties off it. Name the type to do that.

## Type Safety

`deserialize<T>()` returns `T`, which defaults to `unknown`. You can define a type for the data and use it in the client script.

```astro
---
import Serialize from "@ayco/astro-resume";

const data = {
	hello: 'world',
	isOkay: true
}
// define the type of data to be serialized
export type Data = typeof data;
---

<Serialize id="my-data" data={data} />

<script>
import {deserialize} from '@ayco/astro-resume';

/**
* reuse the type in the client
* assuming this component's name is `ThisComponent.astro`
*/
import type {Data} from './ThisComponent.astro';

const data = deserialize<Data>('my-data');

console.log(data) // {hello: 'world', isOkay: true}
</script>
```

A custom parser is typed `(serialized: string) => T`, the same `T` the call returns. So `deserialize<Data>('my-data', parse)` checks that your parser produces `Data`, and `deserialize('my-data', myParser)` infers `T` from `myParser` instead of falling back to `unknown`.

## Passing all Astro.props to client

If you need to make all the component props to the client script:

```astro
---
import Serialize from "@ayco/astro-resume";
export interface Props {
	hello: string;
	isOkay: boolean;
}
---

<Serialize id="preferences" data={{...Astro.props}} />

<script>
import {deserialize} from '@ayco/astro-resume';
import type {Props} from './ThisComponent.astro';
const {hello, isOkay} = deserialize<Props>('preferences');
console.log(hello, isOkay);
</script>
```

## Serialize server data once, access everywhere

If you have shared data that needs to be initialized from the server and accessed in several places on the client-side, you can use `Serialize` once and `deserialize` in any number of Astro components as long as they are in the same page.

In this example, an appConfig object is built and serialized in index.astro and accessed in child Astro components.

In index.astro:

```astro
import Serialize from "@ayco/astro-resume";

const appConfig = {
	someClientSideKey: '1234hello',
}
export type AppConfig = typeof appConfig;
---

<Serialize id="app-config" data={appConfig} />
<Child />
```

In Child.astro:

```astro
<h1>I'm a child. I have access to the appConfig in index!</h1>
<GrandChild />
<script>
import {deserialize} from '@ayco/astro-resume';
import type {AppConfig} from '..pages/index.astro';
const data = deserialize<AppConfig>('app-config');

// ... do something with the app config
</script>
```

In GrandChild.astro:

```astro
<h1>I'm a grand child. I also have access to the appConfig in index!</h1>
<script>
import {deserialize} from '@ayco/astro-resume';
import type {AppConfig} from '..pages/index.astro';
const data = deserialize<AppConfig>('app-config');

// ... do something with the app config
</script>
```

## Using a custom serializer and parser

You can bring your own custom serializer/parser if you want to opt for more complex data handling.

Here's an example of serializing data that `JSON.stringify` cannot (e.g., Date or BigInt) using Rich Harris' [`devalue`](https://github.com/Rich-Harris/devalue):

```astro
---
import {stringify} from 'devalue';
import Serialize from "@ayco/astro-resume";
const data = {
    now: new Date(),
    age: BigInt('3218378192378')
}
export type Data = typeof data;
---

<Serialize data={data} id="my-data" use={stringify} />

<script>
import {parse} from 'devalue';
import {deserialize} from '@ayco/astro-resume';
import type {Data} from './index.astro';

const {age, now} = deserialize<Data>('my-data', parse);
console.log(typeof age); // 'bigint'
console.log(now instanceof Date); // true
</script>
```

Note that a custom serializer's output is written to the page as-is, so it has to do its own escaping — see below. `devalue` does.

## Escaping & XSS

Serialized data is written inside a `<script>` element, so a string like `</script><img src=x onerror=alert(1)>` in your data would otherwise close that element early and let the rest of it run as HTML.

`Serialize` prevents this by escaping every `<` in its output as `\u003c`. That is a valid JSON string escape, so nothing is lost — `deserialize()` gives you the original string back — but `</script` can never appear in the serialized payload.

```astro
<Serialize id="my-data" data={{evil: '</script><img src=x onerror=alert(1)>'}} />

<!-- renders as: -->
<script type="application/json" id="my-data">{"evil":"\u003c/script>\u003cimg src=x onerror=alert(1)>"}</script>
```

Two limits worth knowing:

1. **Custom serializers are not escaped for you.** When you pass `use`, its return value is written to the page unchanged. Use a serializer that escapes `<` itself — [`devalue`](https://github.com/Rich-Harris/devalue) does.
1. **This protects the payload, not what you do with it.** Data you take out of `deserialize()` and put back into the DOM still needs the usual care — prefer `textContent` over `innerHTML`.

## Errors & Warning in `deserialize()`

The `deserialize()` function may give you the following:

1. **ERR: No match found** - there are no `JSON` scripts with the given ID
1. **ERR: Failed to parse data for `<id>`** - a script was found, but `JSON.parse` (or your custom parser) threw on its contents
1. **WARNING: Multiple matches for `<id>`** - there were multiple `JSON` scripts found with the same ID

Thrown errors keep the underlying failure as their [`cause`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error/cause), so the real problem is still there to inspect:

```js
try {
  const data = deserialize<Data>('my-data');
} catch (err) {
  console.error(err.message); // astro-resume ERR: Failed to parse data for "my-data".
  console.error(err.cause);   // SyntaxError: Unexpected token ...
}
```

`Serialize` does the same on the server: if your data cannot be serialized it throws "Data unserializable" with the original `TypeError` — a circular structure, or a `BigInt` with no custom serializer — as the `cause`.

## About

This is a quick and easy pattern to embed serialized information into your HTML and make it available in the client-side script. This doesn't require client-side JS and directly embeds the data on your HTML.

The `Serialize` component will write the data as JSON wrapped in a `<script type="application/json">` element to hold the string.

The `deserialize()` function can then parse the value string for use in your client script.

There is also a pattern [given in the Astro docs](https://docs.astro.build/en/guides/client-side-scripts/#pass-frontmatter-variables-to-scripts) to use a Custom Element that takes a `data-` prop which properly protects the scope of your component. It requires client-side JS.

## Trade-Off

Some other frameworks themselves will manage serialized information and the IDs for you, but we don't have access to this in Astro as we are not really shipping a framework to the browser.

That's nice and ideal (in my opinion), as we are aware of how the HTML is formed and what we are shipping to our users. The trade off is that we do have to manage things ourselves.

You have to manage the IDs (i.e., make sure they are unique) and understand that the `deserialize()` function will crawl the whole document incurring a minimal performance cost depending on how big your HTML is.

The IDs themselves can be any string. Ones that are not valid CSS identifiers — `my.data`, `ns:data[0]`, `1data` — are escaped with `CSS.escape` before the lookup, so they resolve rather than silently failing to match.

## Development

This repository is a pnpm workspace: `package/` is the published package and `demo/` is an Astro site that consumes it.

```
pnpm install
pnpm dev      # run the demo site
pnpm lint     # eslint
pnpm test     # vitest (happy-dom for deserialize, Astro Container API for Serialize)
pnpm check    # astro check on the demo
pnpm release  # bumpp: bump package/package.json, commit, tag, push
```

`pnpm lint`, `pnpm test` and `pnpm check` are the three commands CI runs.

## Upgrading to v1

**The breaking change:** `deserialize<T>` defaults to `unknown` instead of `any`.

```ts
// v0 — `data` was `any`, so this compiled and checked nothing
const data = deserialize('my-data');
data.hello.toUpperCase();

// v1 — name the type
const data = deserialize<Data>('my-data');
data.hello.toUpperCase();
```

Calls that only move the value around — logging it, handing it to something else — keep working untouched. Calls that reach into the result need a type argument or a narrowing check. A custom parser is now typed `(serialized: string) => T` rather than returning `any`, so passing one also gives `T` something to infer from.

Everything else in v1 is backwards compatible:

- `<` in the serialized output is escaped as `\u003c`, so data can no longer break out of the `<script>` element. This changes the bytes on the page, not the value you get back. See [Escaping & XSS](#escaping--xss).
- IDs that are not valid CSS identifiers are escaped with `CSS.escape`, so they now match instead of throwing "No match found".
- A failed parse throws its own error naming the ID, with the parser's `SyntaxError` as `cause`, instead of the bare parser error.
- Errors from `Serialize` carry the original error as `cause`. Previously it was passed as a second argument to `Error()` and silently dropped.
- The `astro` peer dependency widened from `^6` to `>=4`, so the package installs on Astro 4, 5 and 6.

## Road Map

See the [TODO tracker](https://todo.sr.ht/~ayoayco/astro-resume) for planned work items.

## Reporting Issues

To report issues or request features, send a plain text email to [~ayoayco/astro-resume@todo.sr.ht](mailto:~ayoayco/astro-resume@todo.sr.ht) or file a ticket via [SourceHut](https://todo.sr.ht/~ayoayco/astro-resume)
