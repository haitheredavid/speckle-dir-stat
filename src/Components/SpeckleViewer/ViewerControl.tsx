import { observer } from 'mobx-react';
import { useEffect, useRef } from 'react';
import { reaction } from 'mobx';
import Entities, { Entity } from '../../stores/Entities';
import { Stores, stores, useStores } from '../../stores';
import {
	CameraController,
	DefaultViewerParams,
	SelectionExtension,
	SpeckleLoader,
	UrlHelper,
	Viewer,
	ViewerParams,
} from '@speckle/viewer';
import AppStore from '~/stores/AppStore';

//making a react component with mobx that can interface with e.g. selections

const loadEnts = async (viewer: Viewer, entities: Entities) => {
	const { app, ui } = stores as Stores;

	setDefaultSpeckleValues(app);

	// example for working with url stuff
	// https://codesandbox.io/p/sandbox/hide-show-models-pmrd52?file=%2Fsrc%2Findex.ts%3A60%2C40

	const urls = await UrlHelper.getResourceUrls(
		await app.getObjectUrl(),
		app.token
	);

	for (const url of urls) {
		console.log(`url=${url}`);
		const loader = new SpeckleLoader(viewer.getWorldTree(), url, '');
		await viewer.loadObject(loader, true);
	}
};

const setDefaultSpeckleValues = (app: AppStore) => {
	// TODO this should be set by interface and handled properly, lol
	app.setServerUrl(`https://app.speckle.systems`);
	app.setProject('cc54523741');
	app.setModel('005e59a231');
	app.setVersion('0749aa716b');
};

const loadEntities = async (viewer: Viewer, entities: Entities) => {
	//TODO Use API to load object and parse the object into the three.js converter / viewer
	const { app, ui } = stores as Stores;
	setDefaultSpeckleValues(app);

	await viewer.loadObject(await app.getObjectUrl());

	// console.log(viewer.allObjects.filter(o => !!o.userData?.id));

	for (const o of viewer.allObjects.filter((o) => !!o.userData?.id)) {
		// const entity = entities.list.find(e => e.id === o.userData.id);
		o.userData._density = o.userData._size / o.userData.bbox?.volume;

		const entity = new Entity(o.userData.id);

		entity.setSize(o.userData._size);
		entity.setArea(o.userData.area);
		entity.setVolume(o.userData.volume);
		entity.setBoundingVolume(o.userData.bbox?.volume);
		entity.setObjectType(o.userData.speckle_type);
		entity.setObject(o);

		entities.addEntity(entity);
	}

	// autorun(() => {
	//     const selectedIds = entities.list.filter(e => e.selected).map(e => e.id);
	//     viewer.interactions.selectObjects(v => selectedIds.indexOf(v.userData.id) >= 0);
	// })

	let selfInflicted = false;
	let dontReact = false;
	reaction(
		() => entities.selectedIds,
		(selectedIds) => {
			if (dontReact) return;
			selfInflicted = true;
			viewer.interactions.selectObjects(
				(v) => selectedIds.indexOf(v.userData.id) >= 0
			);
			selfInflicted = false;
		}
	);
	reaction(
		() => ui.zoomToId,
		(zoomToId) => {
			if (dontReact) return;
			if (!zoomToId) return;
			viewer.interactions.zoomToMatchingObject(
				(v) => zoomToId === v.userData.id
			);
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
				viewer.applyFilter({
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
					// colorBy: {
					//     type: 'category', property: 'speckle_type', values: {
					//         'Objects.Geometry.Brep': '#a14c06',
					//         'Objects.Geometry.Mesh': '#ee934c'
					//     }
					// },
					ghostOthers: true,
				});
			} else {
				viewer.applyFilter({
					ghostOthers: false,
				});
			}
			selfInflicted = false;
		}
	);

	viewer.on('select', (e: any) => {
		if (selfInflicted) return;
		// console.log('select', e);

		dontReact = true;
		if (e.userData.length > 0) {
			const ids = e.userData.map((v: { id: any }) => v.id);
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
			params.showStats = true;
			params.verbose = true;

			viewer.current = new Viewer(divRef, params);

			const init = async () => {};
			viewer.current.createExtension(CameraController);
			viewer.current.createExtension(SelectionExtension);

			loadEnts(viewer.current, entities);
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
