import { observer } from 'mobx-react';
import { useEffect, useRef } from 'react';
import { reaction } from 'mobx';
import Entities, { Entity } from '../../stores/Entities';
import { Stores, stores, useStores } from '../../stores';
import {
	CameraController,
	DefaultViewerParams,
	FilteringExtension,
	GeometryType,
	SelectionExtension,
	SpeckleLoader,
	TreeNode,
	UrlHelper,
	Viewer,
	ViewerEvent,
} from '@speckle/viewer';
import AppStore from '~/stores/AppStore';

//making a react component with mobx that can interface with e.g. selections

const setDefaultSpeckleValues = (app: AppStore) => {
	// TODO this should be set by interface and handled properly, lol
	app.setServerUrl(`https://app.speckle.systems`);
	app.setProject('cc54523741');
	app.setModel('005e59a231');
	app.setVersion('0749aa716b');
	//TODO make sure this doesnt go live
	app.setToken('');
};

// example for working with url stuff
// https://codesandbox.io/p/sandbox/hide-show-models-pmrd52?file=%2Fsrc%2Findex.ts%3A60%2C40
const loadEntities = async (viewer: Viewer, entities: Entities) => {
	const { app, ui } = stores as Stores;
	setDefaultSpeckleValues(app);

	// this is the real url we load from the app... but for now we're using a url that will pull down multiple objects manually
	/// const objectUrl = await app.getObjectUrl();
	const topo = 'c8cb647b23';
	const parks = '92443a2b36';
	const buildings = '34dbf58819';
	const allSubModels = `https://app.speckle.systems/projects/cc54523741/models/${buildings}`;
	const urls = await UrlHelper.getResourceUrls(allSubModels, app.token);

	for (const url of urls) {
		console.log('Loading', url);
		const loader = new SpeckleLoader(viewer.getWorldTree(), url, app.token);
		await viewer.loadObject(loader, true);
		console.log(`Load complete!`);
	}

	const nodes = viewer
		.getWorldTree()
		.findAll(
			(node: TreeNode) =>
				node.model.renderView &&
				node.model.renderView.geometryType === GeometryType.MESH
		);

	const renderTree = viewer.getWorldTree().getRenderTree();

	let maxDensity = 0;
	let maxVolume = 0;
	let maxByteSize = 0;

	for (const node of nodes) {
		const model = node.model;
		/* no model found */
		if (!model) continue;
		const rvs = renderTree.getRenderViewsForNode(node);
		const rv = rvs[0];
		/* multiply by 8 for number byte size */
		const size = (rv.vertEnd - rv.vertStart) * 8;
		const volume =
			model.raw.bbox.volume !== 0 ? model.raw.bbox.volume : model.raw.bbox.area;
		const density = size / volume;

		const entity = new Entity(model.id);
		/* this makes me sad */
		entity.setSize(size);
		entity.setObject(model.raw);
		entity.setArea(model.raw.bbox.area);
		entity.setVolume(model.raw.volume);
		entity.setBoundingVolume(model.raw.bbox.volume);
		entity.setObjectType(model.raw.speckle_type);
		entities.addEntity(entity);

		if (maxByteSize < size) maxByteSize = size;
		if (maxDensity < density) maxDensity = density;
		if (maxVolume < volume) maxVolume = volume;
	}

	console.log(
		`Setting max values: Volume ${maxVolume} Density ${maxDensity} Size ${maxByteSize}`
	);
	console.log(entities);
	ui.setVolumeMax(maxVolume);
	ui.setDensityMax(maxDensity);
	ui.setMaxByteSize(maxByteSize);
	console.log(ui);

	let selfInflicted = false;
	let dontReact = false;
	reaction(
		() => entities.selectedIds,
		(selectedIds) => {
			if (dontReact) return;
			selfInflicted = true;

			console.log(`CTRL-Selected Ids(${selectedIds?.length})`);

			const sel = viewer.getExtension(SelectionExtension);
			sel.clearSelection();
			sel.selectObjects(selectedIds, true);

			const ext = viewer.getExtension(FilteringExtension);
			ext.resetFilters();
			ext.setUserObjectColors(
				entities.selected.map((value: Entity) => ({
					objectIds: [value.id],
					color: entities.getColor(value.density),
				}))
			);
			ext.isolateObjects(selectedIds);

			selfInflicted = false;
		}
	);
	reaction(
		() => ui.zoomToId,
		(zoomToId) => {
			if (dontReact) return;
			if (!zoomToId) return;

			console.log(`CTRL-Zoom to Id ${zoomToId}`);

			// TODO need to look into extensions for this setting
			//viewer.interactions.zoomToMatchingObject((v) => zoomToId === v.userData.id);
		}
	);
	//
	reaction(
		() => [ui.filterMode, ui.densityRampMax],
		([filterMode, densityRampMax]) => {
			if (dontReact) return;
			selfInflicted = true;
			if (filterMode) {
				console.log(`CTRL-Filter by selection ${filterMode}`);

				const ext = viewer.getExtension(FilteringExtension);
				ext.resetFilters();
				ext.setUserObjectColors([
					{ objectIds: entities.selectedIds, color: '#c8255c' },
				]);
				//TODO replace this colorzing effect

				/* viewer.applyFilter({
					filterBy: {
						id: entities.selectedIds,
					},
					colorBy: {
						type: 'gradient',
						property: '_density',
						minValue: 0,
						maxValue: densityRampMax,
						gradientColors: ['#c8255c', '#1f0454'],
						default: '#000000',
					},
					ghostOthers: true,
				});
			} else {
				viewer.applyFilter({
					ghostOthers: false,
				});*/
			}
			selfInflicted = false;
		}
	);

	viewer.on(ViewerEvent.ObjectClicked, (e: any) => {
		if (selfInflicted || !e) return;
		// console.log('select', e);

		dontReact = true;

		if (e.length && e.length > 0) {
			const ids = e.map((v: { id: any }) => v.id);
			// console.log('selected ID', ids);

			for (const entity of entities.list) {
				entity.setSelected(ids.indexOf(entity.id) >= 0);
				// console.log('selected', entity.id, entity.selected);
			}
		} else {
			for (const entity of entities.list) {
				entity.setSelected(false);
			}
		}
		dontReact = false;
	});
};
let runOnce = false;

export const ViewerControl = observer(() => {
	// @ts-ignore
	const { app, entities } = useStores() as Stores;

	const viewer = useRef<Viewer | null>(null);
	let divRef: HTMLElement | null = null;
	console.log('ViewerControl render');

	// forcing the app to be upclean to get the effect to run
	app.makeUnclean();

	useEffect(() => {
		console.log(`Use Effect triggered, divref == ${divRef} and ${!app.clean}`);
		if (divRef && !app.clean) {
			if (runOnce) return; //SHOULD NOT BE NEEDED when passing empty array as deps, but something is up...
			runOnce = true;
			console.log('useEffect RUNNING');

			const params = DefaultViewerParams;
			params.showStats = false;
			params.verbose = false;

			viewer.current = new Viewer(divRef, params);

			const init = async () => {};
			viewer.current.createExtension(CameraController);
			viewer.current.createExtension(SelectionExtension);
			viewer.current.createExtension(FilteringExtension);

			loadEntities(viewer.current, entities);
		}
	}, [entities, app.clean, divRef]);

	return (
		<div
			ref={(node) => {
				divRef = node;
			}}
			className={'ViewerControl'}
		/>
	);
});
