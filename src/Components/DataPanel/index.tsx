import {observer} from 'mobx-react';
import { Panel } from 'primereact/panel';

import { useStores } from '../../stores';
import SpaceTreemap from "../TreeMap/SpaceTreemap";
import { ManualScatter } from "../ManualScatter/ManualScatter";

export default observer(function DataPanel() {
    const { entities } = useStores();

    return (
        <Panel className="DataPanel" header="Model Data">
            {/*}
            <ManualScatter width={800} height={400}/>
            <SpaceTreemap width={800} height={400}
                          treeTotals={entities.activeTreeMap} />
              */}
        </Panel>
    );
});
