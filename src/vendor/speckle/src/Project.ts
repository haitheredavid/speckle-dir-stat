/**
 * Project
 */

import API from './api';
import SpeckleNode from './Node';
import SpeckleObject from './Object';
import SpeckleApp from './Speckle';
import SpeckleModel from './Model';
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

	public async model(
		obj: SpeckleObject,
		message: string = 'data from @zfs/speckle',
		modelName: string = 'main'
	) {
		return API.query(
			this.parent.server,
			this.parent.token,
			`mutation modelCreate($model: modelCreateInput!){ 
                modelCreate(model: $model)
            }`,
			{
				model: {
					projectId: this.id,
					objectId: obj.id,
					sourceApplication: `@zfs/speckle`,
					modelName,
					message,
				},
			}
		);
	}

	public async writeObject(
		obj: SpeckleBaseObject,
		message?: string,
		modelName?: string
	): Promise<SpeckleObject> {
		const newObject = this.Object(obj.id);

		await this.model(await newObject.write(obj), message, modelName);

		return newObject;
	}

	public get models(): Promise<object> {
		return API.query(
			this.app.server,
			this.app.token,
			`query Project($id: String!) {
                project(id: $id) {
                    models {
                        totalCount
                        items {
                            id
                            name
                            description
                            models(limit: 4) {
                                totalCount
                                items {
                                    id
                                    authorId
                                    authorName
                                    authorAvatar
                                    createdAt
                                    message
                                    referencedObject
                                    modelName
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
