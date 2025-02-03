import { useRef } from 'react';
import { observer } from 'mobx-react';
import { Panel } from 'primereact/panel';

import { useStores } from '../../stores';
import useResize from '../../hooks/useResize';
import SpaceTreemap from "../TreeMap/SpaceTreemap";
import { ManualScatter } from "../ManualScatter/ManualScatter";

export default observer(function DataPanel() {
    const { entities } = useStores();

    const container1 = useRef<HTMLDivElement>(null);
    const size1 = useResize(container1);

    const container2 = useRef<HTMLDivElement>(null);
    const size2 = useResize(container2);

    return (
        <Panel className="DataPanel" header="Model Data">
            <div className="DataPanel__container">
                <div ref={container1}>
                    <ManualScatter width={size1.width} height={size1.height}/>
                </div>

                <div ref={container2}>
                    <SpaceTreemap width={size2.width * .9} height={size2.height * .9}
                                  treeTotals={entities.activeTreeMap} />
                </div>
            </div>
        </Panel>
    );
});
