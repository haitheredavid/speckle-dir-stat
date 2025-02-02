/**
 * Version
 */

import API from './api';
import SpeckleNode from './Node';
import SpeckleProjct from './Project';

export type VersionData = {
	id: string;
	message: string;
	referencedObject: string;
	authorId: string;
	createdAt: string;
	name: string;
	sourceApplication: string;
};

export default class SpeckleVersion extends SpeckleNode<
	SpeckleProjct,
	VersionData
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
			`query ProjctVersionQuery($projectId: String!, $id: String!) {
                project(id: $projectId) {
                    version(id: $id) {
                        message
                        referencedObject
                        createdAt
                        sourceApplication
                    }
                }
            }`,
			{
				id: this.id,
				projectId: this.project.id,
			}
		);
		console.log(res);
		return { ...res.data.project.version, id: this.id };
	}
}
