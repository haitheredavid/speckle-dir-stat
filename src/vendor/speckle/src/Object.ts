/**
 * SpeckleObject
 */

import ObjectLoader from '@speckle/objectloader';

import API from './api';
import SpeckleNode from './Node';
import SpeckleProject from './Project';
import { SpeckleBaseObject } from './types';
import md5 from 'md5';

export default class SpeckleObject extends SpeckleNode<SpeckleProject> {
	protected readonly loader: any;

	constructor(id: string | undefined, project: SpeckleProject) {
		if (id === undefined) id = md5(new Date().toString());

		super(id, project);

		console.log('project id:', project.id);
		this.loader = new ObjectLoader({
			serverUrl: project.app.server,
			token: project.app.token,
			streamId: project.id,
			objectId: id,
		});
	}

	public get url(): string {
		return `${this.project.url}/objects/${this.id}`;
	}

	public get project(): SpeckleProject {
		return this.parent;
	}

	public async write(obj: SpeckleBaseObject): Promise<SpeckleObject> {
		await API.query(
			this.project.app.server,
			this.project.app.token,
			`mutation objectCreate ($object: ObjectCreateInput!) {
                objectCreate(objectInput: $object)
            }`,
			{
				object: {
					projectId: this.project.id,
					objects: [obj],
				},
			}
		);

		this.payload = obj;
		//this._hasBeenFetched = true;

		return this;
	}

	public iterator() {
		return this.loader.getObjectIterator();
	}

	protected async fetch(): Promise<object> {
		return this.loader.getAndConstructObject();
	}
}
