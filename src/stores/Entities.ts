import { action, computed, makeObservable, observable } from 'mobx';
import { Store } from './Store';
import { Stores, stores } from '../stores';
import { EntityDot, TreeNode } from './interfaces';
import chroma from 'chroma-js';
import { formatBytes, formatNum } from '../Components/List/List';

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

	@observable
	public bindObject: object = {};

	@observable
	public selected: boolean = false;

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

	@action
	setObject(obj: object) {
		this.bindObject = obj;
	}

	@action
	setSelected(b: boolean) {
		this.selected = b;
	}

	@computed
	get density() {
		return this.size / this.boundingVolume;
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
		const entity = this.list.find((e) => e.id === id);
		if (entity) {
			entity.setSelected(!entity.selected);
		}
	}

	@action
	selectByRule(predicate: (e: Entity) => boolean) {
		console.log(`ENTITY-Selecting by rule`, predicate);
		this.list.forEach((e, i) => {
			e.setSelected(predicate(e));
		});
	}

	//region computed properties
	@computed
	get selectedIds() {
		return this.list.filter((e) => e.selected).map((e) => e.id);
	}

	@computed
	get sizeDescending() {
		const arr = [...this.list];
		arr.sort((a, b) => b.size - a.size);
		return arr;
	}

	@computed
	get selectedDescending() {
		const arr = [...this.selected];
		arr.sort((a, b) => b.size - a.size);
		return arr;
	}

	@computed
	get selected() {
		return this.list.filter((e) => e.selected);
	}

	@computed
	get colorRamp() {
		const { ui } = stores as Stores;
		return chroma
			.scale(['#414487ff', '#2a788eff', '#22a884ff', '#7ad151ff'])
			.domain([0, ui.densityRampMax])
			.mode('lch');
	}

	getColor(value: number) {
		console.log(value);
		return this.colorRamp(value).hex();
	}

	@computed
	get activeXYPlot(): EntityDot[] {
		const dots: EntityDot[] = [];

		this.list.forEach((item, i) => {
			if (!item || !item.size || !item.boundingVolume) return;

			dots.push({
				id: item.id,
				x: item.boundingVolume,
				y: item.size,
				value: item.density,
				selected: item.selected,
				category: item.objectType,
				color: this.getColor(item.density === undefined ? item.density : 1),
			});
		});

		return dots;
	}

	@computed
	get activeTreeMap(): TreeNode[] {
		const hierarchy: TreeNode[] = [];
		const rootNode = {
			parent: undefined,
			id: '_root',
			area: 0,
		};
		hierarchy.push(rootNode);

		this.sizeDescending.forEach((item, i) => {
			hierarchy.push({
				parent: rootNode.id,
				id: item.id,
				area: item.size,
				selected: item.selected,
				category: item.objectType,
				color: this.getColor(item.density),
				label: [
					`Size: ${formatBytes(item.size)}`,
					`Density: ${formatNum(item.density)}`,
				],
			});
		});

		return hierarchy;
	}
}
