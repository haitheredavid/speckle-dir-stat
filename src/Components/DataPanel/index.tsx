import { useRef } from 'react';
import {observer} from 'mobx-react';
import { Panel } from 'primereact/panel';

import { useStores } from '../../stores';
import useResize from '../../hooks/useResize';
import SpaceTreemap from "../TreeMap/SpaceTreemap";
import { ManualScatter } from "../ManualScatter/ManualScatter";

export default observer(function DataPanel() {
    const { entities } = useStores();
    const container = useRef<HTMLDivElement>(null);
    const size = useResize(container);

    return (
        <Panel className="DataPanel" header="Model Data">
            <div className="DataPanel__container" ref={container}>
                <ManualScatter width={size.height * 2} height={size.height}/>
                {/*}
                <SpaceTreemap width={800} height={400}
                              treeTotals={entities.activeTreeMap} />
                  */}
            </div>
        </Panel>
    );
});
