import {observer} from 'mobx-react';

import {Stores, useStores} from '../../stores';
import DataPanel from '../DataPanel';
import SelectionPanel from '../SelectionPanel';
//import MenuBar from '../MenuBar';


export default observer(function Layout() {
    const {ui} = useStores() as Stores;

    return (
        <div className={`Layout ${ui.layout}`}>
            <div className="navigation">
            </div>

            <DataPanel />
            <SelectionPanel />
        </div>
    );
});
