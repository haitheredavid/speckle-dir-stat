import {observer} from 'mobx-react';
import {FiGrid} from 'react-icons/fi';
import {useStores} from '@strategies/stores';
import {Panel, Title, Toggle, Body} from '@strategies/ui';

import {Stores} from '../../stores';
import Treemap from "../TreeMap";
import data from "../TreeMap/data"

export default observer(function DataPanel() {
    const {ui} = useStores() as Stores;

    return (
        <Panel
            className="DataPanel"
            active={ui.dataPanelIsOpen}
            onToggle={() => ui.setDataPanelOpen(!ui.dataPanelIsOpen)}
        >
            <Title>Stream as Data</Title>
            <Toggle><FiGrid/></Toggle>
            <Body>
                <Treemap data={data} width={400} height={300}/>
            </Body>
        </Panel>
    );
});
