/**
 * Speckle
 */

import { SpeckleConfig } from './types';
import SpeckleProject from './Project';
import SpeckleUser, { UserData } from './User';
import API from './api';
import md5 from 'md5';

export default class SpeckleApp {
	public readonly server: string = 'https://app.speckle.systems';
	public readonly token?: string;

	constructor(args?: SpeckleConfig) {
		if (args) {
			this.server = args.server || this.server;
			this.token = args.token;
		}
	}

	public get getId(): string {
		return md5(new Date().toString());
	}

	public async User(id: string): Promise<UserData> {
		return await new SpeckleUser(id, this).get;
	}

	public Project(id: string): SpeckleProject {
		return new SpeckleProject(id, this);
	}

	public get activeUser(): Promise<UserData> {
		return API.query(
			this.server,
			this.token,
			`query{
            activeUser {
                name
                avatar
                bio
                company
                email
                id
                role
                verified
                projects{
                    cursor
                    totalCount
                    items{
                        id
                        name
                        isPublic
                        size
                    }
                }

            }
        }`
		);
	}

	public get projects(): Promise<object> {
		return API.query(
			this.server,
			this.token,
			`query {
            projects {
                totalCount
                items {
                    id
                    name
                    updatedAt
                }
            }
        }`
		);
	}
}
