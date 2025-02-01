import { observer} from 'mobx-react';
import { Panel } from 'primereact/panel';

import { List } from "../List/List";


export default observer(function SelectionPanel() {
    return (
        <Panel className="SelectionPanel" header="Selected Data">
            <List/>
        </Panel>
    );
});
