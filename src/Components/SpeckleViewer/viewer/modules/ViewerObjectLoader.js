import ObjectLoader from '../../objectloader';
import Converter from './converter/Converter';

/**
 * Helper wrapper around the ObjectLoader class, with some built in assumptions.
 */

export default class ViewerObjectLoader {
	constructor(parent, objectUrl, authToken, enableCaching) {
		this.objectUrl = objectUrl;
		this.viewer = parent;
		this.token = null;
		try {
			this.token = authToken || localStorage.getItem('AuthToken');

			if (!this.token) {
				console.warn(
					'Viewer: no auth token present. Requests to non-public stream objects will fail.'
				);
			}

			// example url: `https://staging.speckle.dev/streams/a75ab4f10f/objects/f33645dc9a702de8af0af16bd5f655b0`
			// new api path example : `https://app.speckle.systems/projects/cc54523741/models/c38e93301c8d329960c20f6e9e6285fb`
			this.objectUrl = `https://app.speckle.systems/projects/cc54523741/models/a7759c380aaff408594f279424b1292b`;

			console.log(`url: ${this.objectUrl}`);

			const url = new URL(this.objectUrl);

			const segments = url.pathname.split('/');
			if (
				segments.length < 5 ||
				url.pathname.indexOf('projects') === -1 ||
				url.pathname.indexOf('models') === -1
			) {
				throw new Error('Unexpected object url format.');
			}

			this.serverUrl = url.origin;
			this.streamId = segments[2];
			this.objectId = segments[4];
			console.log(
				`API: Object Ready! server: ${this.serverUrl}, project: ${this.streamId}, object: ${objectUrl}`
			);

			this.loader = new ObjectLoader({
				serverUrl: this.serverUrl,
				token: this.token,
				streamId: this.streamId,
				objectId: this.objectId,
				options: { enableCaching },
			});

			this.converter = new Converter(this.loader);
		} catch (error) {
			// Accessing localStorage may throw when executing on sandboxed document, ignore.
			console.log(error);
			throw error;
		} finally {
			this.lastAsyncPause = Date.now();
			this.existingAsyncPause = null;
			this.cancel = false;
		}
	}

	async asyncPause() {
		// Don't freeze the UI
		if (Date.now() - this.lastAsyncPause >= 100) {
			this.lastAsyncPause = Date.now();
			await new Promise((resolve) => setTimeout(resolve, 0));
		}
	}

	async load() {
		let first = true;
		let current = 0;
		let total = 0;
		let viewerLoads = 0;
		let firstObjectPromise = null;
		for await (const obj of this.loader.getObjectIterator()) {
			if (this.cancel) {
				this.viewer.emit('load-progress', {
					progress: 1,
					id: this.objectId,
					url: this.objectUrl,
				}); // to hide progress bar, easier on the frontend
				this.viewer.emit('load-cancelled', {
					id: this.objectId,
					url: this.objectUrl,
				});
				return;
			}
			await this.converter.asyncPause();
			if (first) {
				firstObjectPromise = this.converter.traverseAndConvert(
					obj,
					async (objectWrapper) => {
						await this.converter.asyncPause();
						objectWrapper.meta.__importedUrl = this.objectUrl;
						this.viewer.sceneManager.addObject(objectWrapper);
						viewerLoads++;
					}
				);
				first = false;
				total = obj.totalChildrenCount;
			}
			current++;
			this.viewer.emit('load-progress', {
				progress: current / (total + 1),
				id: this.objectId,
			});
		}

		if (firstObjectPromise) {
			await firstObjectPromise;
		}

		await this.viewer.sceneManager.postLoadFunction();

		if (viewerLoads === 0) {
			console.warn(`Viewer: no 3d objects found in object ${this.objectId}`);
			this.viewer.emit('load-warning', {
				message: `No displayable objects found in object ${this.objectId}.`,
			});
		}

		this.viewer.sceneManager.sceneObjects.allObjects.traverse(function (child) {
			if (child.userData && child.geometry)
				child.userData._size = roughSizeOfObject(child.geometry);
		});
	}

	async unload() {
		this.cancel = true;
		await this.viewer.sceneManager.removeImportedObject(this.objectUrl);
	}

	cancelLoad() {
		this.cancel = true;
	}
}

function roughSizeOfObject(object) {
	var objectList = [];

	var recurse = function (value) {
		var bytes = 0;

		if (typeof value === 'boolean') {
			bytes = 4;
		} else if (typeof value === 'string') {
			bytes = value.length * 2;
		} else if (typeof value === 'number') {
			bytes = 8;
		} else if (typeof value === 'object' && objectList.indexOf(value) === -1) {
			objectList[objectList.length] = value;

			for (let i in value) {
				bytes += 8; // an assumed existence overhead
				bytes += recurse(value[i]);
			}
		}

		return bytes;
	};

	return recurse(object);
}

const graveyard = () => {
	console.log('ALL SIZES');
	const sums = {};
	const processKids = (node, parents) => {
		if (node.children) {
			for (let i = 0, l = node.children.length; i < l; i++) {
				let child = node.children[i];

				const id = child.userData?.id;
				const parentage = [...parents];
				if (id) {
					const size = this.loader.sizes[id];
					parentage.push(id);
					parentage.forEach((pId, i) => {
						if (!sums[pId]) sums[pId] = 0;
						sums[pId] += size;
					});
				}
				processKids(child, [...parents, id]);
			}
		}
		if (node.userData) node.userData._size = sums[node.userData.id];
	};
	processKids(this.viewer.sceneManager.sceneObjects.allObjects, []);
};
