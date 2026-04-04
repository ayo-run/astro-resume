export class SerializedRegistry {
    private _registeredIds: string[]
    constructor() {}
    get registeredIds() {
        return this._registeredIds;
    }
    public register(id: string) {
        if (this._registeredIds.includes(id))
            throw Error(`${id} is already used`)
        this._registeredIds.push(id);
    }
}