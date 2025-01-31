import { createContext, useContext } from 'react';

import { Store } from '~/stores/Store';
import UIStore from '~/stores/UIStore';
import Entities from '~/stores/Entities';
import AppStore from '~/stores/AppStore';

export type Stores = {[key: string]: Store} & {
    app: AppStore;
    ui: UIStore;
    entities: Entities;
}

export const stores = {} as Stores;
export let storesContext = createContext<Stores>(stores);

export function useStores() {
    return useContext(storesContext);
}

export function register(_stores: Stores) {
    Object.entries(_stores)
        .forEach(([key, store]) => stores[key] = store);
}

export default function initializeStores() {
    register({
        app: new AppStore(),
        ui: new UIStore(),
        entities: new Entities(),
    })
}
