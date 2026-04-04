/**
 * Function to find and deserialize JSON data from the HTML
 * @param id The id of the Serialize component, used to find the serialized data in the HTML
 * @param parser Custom parser to be used
 * @returns The deserialized JSON data
 * @see Usage examples in 👉 https://ayco.io/gh/astro-resume#usage
**/
export function deserialize<T = any>(id: string, parser?: (serialized: string) => any): T {
    const elements = document.querySelectorAll<HTMLScriptElement>(`script#${id}[type="application/json"]`);

    if (elements?.length > 0) {
        if (elements?.length > 1)
            console.warn(`astro-resume WARN: Multiple matches for "${id}". The function will parse the first one.`)

        const element = elements[0];

        if (element?.textContent)
            return parser
                ? parser(element.textContent)
                : JSON.parse(element.textContent)
    }

    throw Error(`astro-resume ERR: No match found.
    "deserialize('${id}')" did not find any data.
    Check that the following are correct:
    - The Serialize component is used with correct props
    - "data" prop is not undefined
    - "${id}" is the "id" of the Serialize component
    See examples: https://ayco.io/gh/astro-resume#usage
Stack trace: `)
}