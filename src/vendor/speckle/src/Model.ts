import API from './api';
import SpeckleNode from './Node';
import SpeckleProjct from './Project';
import SpeckleVersion from './Version';

export type ModelData = {
	id: string;
	name: string;
	displayName: string;
	description: string;
	author: string;
};

export default class SpeckleModel extends SpeckleNode<
	SpeckleProjct,
	ModelData
> {
	public get url(): string {
		return `${this.project.url}/models/${this.id}`;
	}

	public get project(): SpeckleProjct {
		return this.parent;
	}
	public Version(id: string): SpeckleVersion {
		return new SpeckleVersion(id, this);
	}

	protected async fetch(): Promise<ModelData> {
		const res = await API.query(
			this.project.app.server,
			this.project.app.token,
			`query ProjctModelQuery($projectId: String!, $id: String!) {
                project(id: $projectId) {
                    model(id: $id) {
                        name
                        displayName
                        description
                        author

                    }
                }
            }`,
			{
				id: this.id,
				projectId: this.project.id,
			}
		);
		console.log(res);
		return { ...res.data.project.model, id: this.id };
	}
}
