import {action, computed, makeObservable, observable} from "mobx";
import {Store} from "@strategies/stores";
import {EntityDot, TreeNode} from "./interfaces";
import chroma from "chroma-js"

export class Entity {
    constructor(id: string) {
        makeObservable(this);

        this.id = id;
    }

    @observable
    public id: string;

    @observable
    public size: number = 0;
    @observable
    public area: number = 0;
    @observable
    public volume: number = 0;
    @observable
    public boundingVolume: number = 0;
    @observable
    public objectType: string = '';

    @action
    setSize(size: number) {
        this.size = size;
    }

    @action
    setArea(size: number) {
        this.area = size;
    }

    @action
    setVolume(size: number) {
        this.volume = size;
    }

    @action
    setBoundingVolume(size: number) {
        this.boundingVolume = size;
    }

    @action
    setObjectType(objectType: string) {
        this.objectType = objectType;
    }

    @observable
    public selected: boolean = false;

    @action
    setSelected(b: boolean) {
        this.selected = b;
    }
}

export default class Entities extends Store {
    //region constructor
    constructor() {
        super();
        makeObservable(this);
    }

    //endregion

    //region fields
    public enabled: boolean = false;
    //endregion

    //region observables
    @observable
    public list: Entity[] = [];
    //endregion

    //region actions
    @action
    public addEntity(entity: Entity) {
        this.list.push(entity);
    }

    @action
    public toggleSelection(id: string) {
        const entity = this.list.find(e => e.id === id);
        if (entity) {
            entity.setSelected(!entity.selected);
        }
    }

    //endregion

    //region getter/setters
    @observable
    age: number = 0;

    @action
    public setAge(value: number) {
        this.age = value;
    }

    //endregion

    //region computed properties
    @computed
    get selectedIds() {
        return this.list.filter(e => e.selected).map(e => e.id);
    }

    @computed
    get sizeDescending() {
        const arr = [...this.list];
        arr.sort((a, b) => b.size - a.size);
        return arr;
    }


    @computed
    get colorRamp() {
        return chroma.scale([
            '#1f0454',
            // '#6f2b97',
            '#c8255c',
            // '#eeac1a',
            // '#ffe800',
            // '#fffc9e'
        ]).domain([1000, 0]).mode('lch');
    }

    getColor(value: number) {
        return this.colorRamp(value).hex();
    }

    @computed
    get activeXYPlot(): EntityDot[] {
        const hierarchy: EntityDot[] = [];

        this.list.forEach((item, i) => {
            if (!item.area || !item.size || !item.boundingVolume)
                return;

            hierarchy.push({
                id: item.id,
                x: item.size,
                y: item.area,
                value: item.size / item.boundingVolume,
                selected: item.selected,
                category: item.objectType,
                color: this.getColor(item.size / item.boundingVolume),
            })
        });

        return hierarchy;
    }

    @computed
    get activeTreeMap(): TreeNode[] {
        const hierarchy: TreeNode[] = [];
        const rootNode = {
            parent: undefined,
            id: '_root',
            area: 0,
        }
        hierarchy.push(rootNode);

        this.list.forEach((item, i) => {
            hierarchy.push({
                parent: rootNode.id,
                id: item.id,
                area: item.size,
                selected: item.selected,
                category: item.objectType,
                color: this.getColor(item.size / item.boundingVolume),
                label: [`${item.size}`, `${item.size / item.boundingVolume}`],
            })
        });

        return hierarchy;
    }


    //endregion

    //region public methods


    //endregion

    //region private methods

    //endregion
}
