/**
 * Project
 */

import API from './api';
import SpeckleModel from './Model';
import SpeckleNode from './Node';
import SpeckleObject from './Object';
import SpeckleApp from './Speckle';
import { SpeckleBaseObject } from './types';

export default class SpeckleProject extends SpeckleNode<SpeckleApp> {
	public get url(): string {
		return `${this.app.server}/projects/${this.id}`;
	}

	public get app(): SpeckleApp {
		return this.parent;
	}

	public Object(id: string): SpeckleObject {
		return new SpeckleObject(id, this);
	}

	public Model(id: string): SpeckleModel {
		return new SpeckleModel(id, this);
	}
	public async createVersion(
		obj: SpeckleObject,
		message: string = 'data from @zfs/speckle',
		model: SpeckleModel
	) {
		return API.query(
			this.parent.server,
			this.parent.token,
			`mutation VersionCreate($Version: VersionCreateInput!){ 
                VersionCreate(Version: $Version)
            }`,
			{
				Version: {
					projectId: this.id,
					objectId: obj.id,
					sourceApplication: `@zfs/speckle`,
					model,
					message,
				},
			}
		);
	}

	public async writeObject(
		obj: SpeckleBaseObject,
		message?: string,
		VersionName?: string
	): Promise<SpeckleObject> {
		const newObject = this.Object(obj.id);

		//	await this.Version(await newObject.write(obj), message, VersionName);

		return newObject;
	}

	public get Versions(): Promise<object> {
		return API.query(
			this.app.server,
			this.app.token,
			`query Project($id: String!) {
                projects(id: $id) {
                    Versions {
                        totalCount
                        items {
                            id
                            name
                            description
                            Versions(limit: 4) {
                                totalCount
                                items {
                                    id
                                    authorId
                                    authorName
                                    authorAvatar
                                    createdAt
                                    message
                                    referencedObject
                                    VersionName
                                    sourceApplication
                                }
                            }
                        }
                    }
                 }
            }`,
			{ id: this.id }
		);
	}

	public get collaborators(): Promise<object> {
		return API.query(
			this.app.server,
			this.app.token,
			`query Project($id: String!) {
                project(id: $id) {
                    collaborators {
                        id
                        name
                        role
                        company
                        avatar
                    }
                }
            }`,
			{ id: this.id }
		);
	}

	protected async fetch() {
		return API.query(
			this.app.server,
			this.app.token,
			`query Project($id: String!) {
                project(id: $id) {
                    id
                    name
                    description
                    isPublic
                    createdAt
                    updatedAt
                    role
                }
            }`,
			{ id: this.id }
		);
	}
}
