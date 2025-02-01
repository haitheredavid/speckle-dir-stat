import { createContext, useContext } from 'react';

import { Store } from './Store';
import UIStore from './UIStore';
import Entities from './Entities';
import AppStore from './AppStore';

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
