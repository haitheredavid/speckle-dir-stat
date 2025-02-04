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
	NodeRenderView,
	PropertyInfo,
	SelectionExtension,
	SpeckleLoader,
	StringPropertyInfo,
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
	const allSubModels = `https://app.speckle.systems/projects/cc54523741/models/01845db95a,34dbf58819,49fd668697,92443a2b36,c8cb647b23`;
	const urls = await UrlHelper.getResourceUrls(allSubModels, app.token);

	let filteredProps: PropertyInfo[] = [];

	// triggers everytime a single model is loaded, not the complete scene
	viewer.on(ViewerEvent.LoadComplete, async (id: string) => {
		// simple way of grabbing the props we might need
		console.log('grabbing props from ', id);
		const props = await viewer.getObjectProperties(id);
		const filtered = props.filter((value) => {
			switch (value.key) {
				case 'id':
					return true;
				case 'area':
					return true;
				case 'volume':
					return true;
				case 'speckle_type':
					return true;
				default:
					return false;
			}
		});
		filteredProps.push(...filtered);
	});

	for (const url of urls) {
		const loader = new SpeckleLoader(viewer.getWorldTree(), url, app.token);
		await viewer.loadObject(loader, true);
		console.log(`Load complete for ${url}`);
	}

	const vertices = viewer
		.getWorldTree()
		.getRenderTree()
		.getRenderViewNodesForNode(viewer.getWorldTree().root);

	const worldTree = viewer.getWorldTree().findAll(
		// @ts-ignore
		(node: TreeNode) =>
			node.model.renderView &&
			node.model.renderView.geometryType === GeometryType.MESH
	);

	let maxDensity = 0;
	let maxVolume = 0;
	let maxByteSize = 0;
	console.log('World=', viewer.World);

	//@ts-ignore
	for (const p of filteredProps.filter((i) => i.key === 'id')) {
		// step in to the collection
		// @ts-ignore
		for (const prop of p.valueGroups) {
			// finally at the id level
			for (const id of prop.ids) {
				// filter out top level ids to the model
				if (!id.includes(`/`)) {
					// probably a better way to do this...
					const obj = viewer.getWorldTree().findId(id);
					if (!obj) continue;

					// console.log(obj);
					//@ts-ignore
					const raw = obj[0].model.raw;
					if (raw.speckle_type !== 'Objects.Geometry.Mesh') continue;

					const bbox = raw.bbox;
					// raw._density = raw.volume / bbox?.volume;
					raw._density = Math.random();

					if (maxDensity < raw._density) maxDensity = raw._density;
					if (maxVolume < raw.volume) maxVolume = raw.volume;

					const entity = new Entity(id);

					// TODO get byte size instead of density
					entity.setSize(raw._density);
					entity.setArea(raw.area);
					entity.setVolume(raw.volume);
					entity.setBoundingVolume(bbox?.volume);
					entity.setObjectType(raw.speckle_type);
					entity.setObject(raw);

					entities.addEntity(entity);
				}
			}
		}
	}

	ui.setVolumeMax(maxVolume);
	ui.setDensityMax(maxDensity);

	let selfInflicted = false;
	let dontReact = false;
	reaction(
		() => entities.selectedIds,
		(selectedIds) => {
			if (dontReact) return;
			selfInflicted = true;

			const ext = viewer.getExtension(FilteringExtension);
			ext.resetFilters();
			ext.isolateObjects(selectedIds, '', true, true);
			selfInflicted = false;
		}
	);
	reaction(
		() => ui.zoomToId,
		(zoomToId) => {
			if (dontReact) return;
			if (!zoomToId) return;
			// TODO need to look into extensions for this setting
			//viewer.interactions.zoomToMatchingObject((v) => zoomToId === v.userData.id);
			ui.setZoomToId(''); //clear for the next click (so we can click the same object again if needed)
		}
	);
	//
	reaction(
		() => [ui.filterMode, ui.densityRampMax],
		([filterMode, densityRampMax]) => {
			if (dontReact) return;
			selfInflicted = true;
			if (filterMode) {
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
