import { experimental_AstroContainer as AstroContainer } from 'astro/container'
import { stringify } from 'devalue'
import { beforeAll, describe, expect, it } from 'vitest'
import Serialize from '../Serialize.astro'

let container: AstroContainer

beforeAll(async () => {
  container = await AstroContainer.create()
})

function render(props: Record<string, unknown>) {
  return container.renderToString(Serialize, {
    props
  })
}

/** Pull the contents of the rendered `<script>` back out of the HTML. */
function scriptBody(html: string) {
  const match = html.match(/<script[^>]*>([\s\S]*)<\/script>/)
  if (!match) throw new Error(`no script element in: ${html}`)
  return match[1]
}

describe('Serialize', () => {
  it('renders a JSON script tag carrying the id', async () => {
    const html = await render({
      id: 'my-data', data: {
        hello: 'world'
      }
    })

    expect(html).toContain('type="application/json"')
    expect(html).toContain('id="my-data"')
    expect(JSON.parse(scriptBody(html))).toEqual({
      hello: 'world'
    })
  })

  it('round-trips nested data unchanged', async () => {
    const data = {
      nameStr: 'John Doe',
      isOkayBool: true,
      moodNull: null,
      countNum: 42,
      listArr: [1, 'two', {
        three: true
      }],
      nested: {
        deep: {
          deeper: 'value'
        }
      }
    }

    expect(JSON.parse(scriptBody(await render({
      id: 'nested', data
    })))).toEqual(data)
  })

  describe('xss protection', () => {
    const breakout = '</script><img src=x onerror=alert(1)>'

    it('escapes "<" as \\u003c so the payload cannot close the script', async () => {
      const html = await render({
        id: 'evil', data: {
          evil: breakout
        }
      })
      const body = scriptBody(html)

      expect(body).not.toContain('</script')
      expect(body).not.toContain('<')
      expect(body).toContain('\\u003c')
    })

    it('still parses back to the original string', async () => {
      const html = await render({
        id: 'evil', data: {
          evil: breakout
        }
      })

      expect(JSON.parse(scriptBody(html))).toEqual({
        evil: breakout
      })
    })

    it.each([
      ['a key', {
        '</script><script>alert(1)</script>': 'value'
      }],
      ['a nested value', {
        outer: {
          inner: ['</SCRIPT >', '<!--</script>']
        }
      }],
      ['a lone "<"', {
        lt: 'a < b'
      }]
    ])('escapes "<" appearing in %s', async (_label, data) => {
      const body = scriptBody(await render({
        id: 'evil', data
      }))

      expect(body).not.toContain('<')
      expect(JSON.parse(body)).toEqual(data)
    })

    it('leaves no "</script" behind with the devalue serializer either', async () => {
      const data = {
        evil: breakout, when: new Date(0)
      }
      const body = scriptBody(await render({
        id: 'evil', data, use: stringify
      }))

      expect(body).not.toContain('</script')
    })
  })

  it('uses a custom serializer when `use` is given', async () => {
    const html = await render({
      id: 'custom',
      data: {
        now: new Date(0)
      },
      use: stringify
    })

    expect(scriptBody(html)).toBe(stringify({
      now: new Date(0)
    }))
  })

  it('throws a helpful error when the data is unserializable', async () => {
    const circular: Record<string, unknown> = {}
    circular.self = circular

    await expect(render({
      id: 'bad', data: circular
    }))
      .rejects.toThrow('Data unserializable')
  })

  it('keeps the original failure as `cause`', async () => {
    const html = render({
      id: 'bad', data: {
        big: BigInt(1)
      }
    })

    await expect(html).rejects.toThrowError(expect.objectContaining({
      cause: expect.any(TypeError)
    }))
  })
})
