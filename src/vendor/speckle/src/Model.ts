/**
 * Model
 */

import API from './api';
import SpeckleNode from './Node';
import SpeckleProjct from './Project';

export type ModelData = {
	id: string;
	message: string;
	referencedObject: string;
	authorId: string;
	createdAt: string;
	name: string;
	sourceApplication: string;
};

export default class SpeckleModel extends SpeckleNode<
	SpeckleProjct,
	ModelData
> {
	public get url(): string {
		return `${this.project.url}/projects/${this.id}`;
	}

	public get project(): SpeckleProjct {
		return this.parent;
	}

	protected async fetch() {
		const res = await API.query(
			this.project.app.server,
			this.project.app.token,
			`query ProjctModelQuery($projectId: String!, $id: String!) {
                project(id: $projectId) {
                    model(id: $id) {
                        message
                        referencedObject
                        authorId
                        createdAt
                        branchName
                        sourceApplication
                    }
                }
            }`,
			{
				id: this.id,
				projectId: this.project.id,
			}
		);

		return { ...res.data.project.project, id: this.id };
	}
}
