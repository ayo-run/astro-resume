// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { deserialize } from '../deserialize'

/** Put a serialized payload in the document the way `Serialize.astro` would. */
function mount(id: string, content: string, type = 'application/json') {
  const script = document.createElement('script')
  script.setAttribute('type', type)
  script.id = id
  script.textContent = content
  document.body.appendChild(script)
  return script
}

afterEach(() => {
  document.body.innerHTML = ''
  vi.restoreAllMocks()
})

describe('deserialize', () => {
  it('parses the JSON found under the given id', () => {
    mount('my-data', JSON.stringify({
      hello: 'world', isOkay: true
    }))

    expect(deserialize('my-data')).toEqual({
      hello: 'world', isOkay: true
    })
  })

  it('uses a custom parser when one is passed', () => {
    mount('my-data', 'not json, the parser decides')
    const parser = vi.fn(() => ({
      parsed: true
    }))

    expect(deserialize('my-data', parser)).toEqual({
      parsed: true
    })
    expect(parser).toHaveBeenCalledWith('not json, the parser decides')
  })

  it('reads back a payload containing escaped "</script"', () => {
    // What `Serialize.astro` emits for `{evil: '</script><img src=x onerror=alert(1)>'}`
    mount('xss', '{"evil":"\\u003c/script>\\u003cimg src=x onerror=alert(1)>"}')

    expect(deserialize<{ evil: string }>('xss').evil)
      .toBe('</script><img src=x onerror=alert(1)>')
  })

  // Not covered: ids starting with a digit, or containing whitespace. For
  // those `CSS.escape` emits the hex form (`\31 data`), which happy-dom's
  // selector engine does not resolve even though browsers do — asserting on
  // them would pin the limitation rather than the behaviour.
  it.each([
    ['dots', 'a.b.c'],
    ['colons and brackets', 'ns:data[0]'],
    ['a hash and a slash', 'data#1/2']
  ])('escapes ids containing %s', (_label, id) => {
    mount(id, JSON.stringify({
      ok: true
    }))

    expect(deserialize(id)).toEqual({
      ok: true
    })
  })

  it('warns and parses the first match when an id is duplicated', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    mount('dupe', JSON.stringify({
      which: 'first'
    }))
    mount('dupe', JSON.stringify({
      which: 'second'
    }))

    expect(deserialize('dupe')).toEqual({
      which: 'first'
    })
    expect(warn).toHaveBeenCalledOnce()
    expect(warn.mock.calls[0][0]).toContain('Multiple matches for "dupe"')
  })

  it('ignores scripts that are not type="application/json"', () => {
    mount('my-data', JSON.stringify({
      hello: 'world'
    }), 'module')

    expect(() => deserialize('my-data')).toThrow('No match found')
  })

  it('throws when nothing matches the id', () => {
    expect(() => deserialize('missing')).toThrow('No match found')
  })

  it('throws when the matched element is empty', () => {
    mount('empty', '')

    expect(() => deserialize('empty')).toThrow('No match found')
  })

  it('throws with the parse failure as cause', () => {
    mount('broken', '{not valid json')

    let thrown: Error | undefined
    try {
      deserialize('broken')
    } catch (err) {
      thrown = err as Error
    }

    expect(thrown?.message).toContain('Failed to parse data for "broken"')
    expect(thrown?.cause).toBeInstanceOf(Error)
  })

  it('propagates a failure from a custom parser as cause', () => {
    mount('broken', 'anything')
    const boom = new Error('parser said no')

    expect(() => deserialize('broken', () => {
      throw boom
    }))
      .toThrow('Failed to parse data for "broken"')
    expect(() => deserialize('broken', () => {
      throw boom
    }))
      .toThrowError(expect.objectContaining({
        cause: boom
      }))
  })
})
