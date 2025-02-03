import { Store } from './Store';
import { action, makeObservable, observable } from 'mobx';
import {
	buildUrl,
	exchangeAccessCode,
	goToSpeckleAuthPage,
	send,
	getReferencedObject,
	speckleLogOut,
} from '../Components/SpeckleApi';
import { Entity } from './Entities';

export default class AppStore extends Store {
	constructor() {
		super();
		makeObservable(this);
	}

	@observable
	clean: boolean = true;

	@action
	makeUnclean() {
		this.clean = false;
	}

	@observable
	url: string = '';

	@action
	setUrl(url: string) {
		this.url = url;
	}

	@observable
	token?: string;

	@action
	setToken(token: string) {
		this.token = token;
	}

	@action
	logout() {
		speckleLogOut();
	}

	@action
	exchangeAccessCode(accessCode: string) {
		return exchangeAccessCode(accessCode, this.serverUrl);
	}

	@action
	redirectToAuth() {
		goToSpeckleAuthPage(this.serverUrl);
	}

	@observable
	serverUrl: string = '';

	@action
	setServerUrl(serverUrl: string) {
		this.serverUrl = serverUrl;
	}

	@observable
	projectId: string = '';

	@action
	setProject(id: string) {
		this.projectId = id;
	}

	@observable
	modelId: string = '';

	@action
	setModel(id: string) {
		this.modelId = id;
	}

	@observable
	versionId: string = '';

	@action
	setVersion(id: string) {
		this.versionId = id;
	}

	async getObjectUrl(): Promise<string> {
		return await buildUrl(
			this.projectId,
			this.modelId,
			this.versionId,
			this.serverUrl,
			this.token!
		);
	}

	async getReferencedObject(): Promise<string> {
		return await getReferencedObject(
			this.projectId,
			this.modelId,
			this.versionId,
			this.serverUrl
		);
	}

	@action
	sendSelected(entities: Entity[]) {
		const token: string = this.token === undefined ? '' : this.token;

		if (this.token !== '' || entities?.length === 0) {
			return send(entities, this.projectId, this.serverUrl, token);
		}
	}
}
