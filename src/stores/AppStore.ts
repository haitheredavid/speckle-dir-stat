import { Store } from './Store';
import { action, makeObservable, observable } from 'mobx';
import {
	buildUrl,
	exchangeAccessCode,
	goToSpeckleAuthPage,
	send,
	speckleLogOut,
} from '../Components/SpeckleApi';
import { Entity } from './Entities';

export default class AppStore extends Store {
	constructor() {
		super();
		makeObservable(this);
		this.setUrl(
			'https://app.speckle.systems/projects/cc54523741/models/a7759c380aaff408594f279424b1292b'
		);
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
	setprojectId(projectId: string) {
		this.projectId = projectId;
	}

	@observable
	modelId: string = '';

	@action
	setmodelId(modelId: string) {
		this.modelId = modelId;
	}

	async getObjectUrl(): Promise<string> {
		if (this.url !== '') {
			const url = new URL(this.url);

			const splitUrl = url.pathname.split('/');

			this.setprojectId(splitUrl[2]);
			this.setmodelId(splitUrl[4]);
			this.setServerUrl(url.origin);

			return await buildUrl(
				this.projectId,
				this.modelId,
				this.serverUrl,
				this.token
			);
		}

		return '';
	}

	@action
	sendSelected(entities: Entity[]) {
		const token: string = this.token === undefined ? '' : this.token;

		if (this.token !== '' || entities?.length === 0) {
			return send(entities, this.projectId, this.serverUrl, token);
		}
	}
}
