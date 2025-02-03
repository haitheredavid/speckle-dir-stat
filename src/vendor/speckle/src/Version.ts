/**
 * Version
 */

import API from './api';
import SpeckleModel from './Model';
import SpeckleNode from './Node';
import SpeckleProject from './Project';

export type VersionData = {
	id: string;
	message: string;
	referencedObject: string;
	authorId: string;
	createdAt: string;
	name: string;
	sourceApplication: string;
	previewUrl: string;
};

export default class SpeckleVersion extends SpeckleNode<
	SpeckleModel,
	VersionData
> {
	/*

	the url for looking up a specifc version has changed 
	now the url must be
	{server-url}/projects/{projectId}/models/{modelId}@{versionId} 

	an example 👇🏻
	https://app.speckle.systems/projects/cc54523741/models/005e59a231@0749aa716b
	 */

	public get url(): string {
		return `${this.project.url}/models/${this.model.id}@${this.id}`;
	}

	public get model(): SpeckleModel {
		return this.parent;
	}

	public get project(): SpeckleProject {
		return this.parent.project;
	}

	public async getUrl(): Promise<string> {
		const data = await this.fetch();
		return this.url;
	}

	protected async fetch() {
		console.log(`Fetching Version at ${this.url}`);
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
		if (res) return { ...res.data.project.version, id: this.id };
	}
}
