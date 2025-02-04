import { observer } from 'mobx-react';
import { Entity } from '../../stores/Entities';
import { Stores, useStores } from '../../stores';
import { Button } from 'primereact/button';

type ListItemProps = {
	item: Entity;
};

export const formatBytes = (size: number) => {
	return `${Math.round(10 * (size / 1024)) / 10} kb`;
};
export const formatNum = (val: number) => {
	if (val > 1000) {
		return Math.round(val).toLocaleString();
	}
	return `${Math.round(10 * val) / 10}`;
};

export const ListItem = observer(({ item }: ListItemProps) => {
	const objectTypeDisplay = item.objectType.split('.')[2];
	const { app, ui } = useStores() as Stores;

	//TODO replace with a ceteralized
	const href = `https://app.speckle.systems/projects/${app.projectId}/models/${item.id}`;
	return (
		<div
			className={'ListItem' + (item.selected ? ' selected' : '')}
			onClick={() => {
				// item.setSelected(!item.selected);
			}}
		>
			<div className={'smaller'}>
				<div className={'label'}>Id</div>
				<div className={'value'}>
					<a href={href} target={'_blank'} rel='noreferrer'>
						{item.id}
					</a>
				</div>
			</div>
			<div className={'left'}>
				<div>
					<div className={'label'}>Size</div>
					<div className={'value'}>{formatBytes(item.size)}</div>
				</div>
				<div>
					<div className={'label'}>Bounds</div>
					<div className={'value'}>{formatNum(item.boundingVolume * 100)}</div>
				</div>
				<div>
					<div
						className={'label'}
						onClick={() => {
							ui.setDensityMax(item.density);
						}}
					>
						Density
					</div>
					<div className={'value'}>{formatNum(item.density)}</div>
				</div>
			</div>
			<div className={'right'}>
				<div>
					<div className={'label'}>Area</div>
					<div className={'value'}>{formatNum(item.area)}</div>
				</div>
				<div>
					<div className={'label'}>Volume</div>
					<div className={'value'}>{formatNum(item.volume)}</div>
				</div>
			</div>
			<Button
				className={'tag'}
				onClick={() => {
					ui.setZoomToId(item.id);
				}}
			>
				{objectTypeDisplay}
			</Button>
		</div>
	);
});

export const List = observer(() => {
	const { entities, ui, app } = useStores() as Stores;

	return (
		<div className={'List'}>
            <div className="List__items">
                {entities.selectedDescending.map((e) => (
                    <ListItem key={e.id} item={e} />
                ))}
            </div>
            <div className="List__buttons">
                <Button
                    onClick={() => {
                        ui.setFilterMode(!ui.filterMode);
                    }}
                >
                    {ui.filterMode ? 'Clear Filter' : 'Filter'}
                </Button>
                <Button
                    onClick={() => {
                        app.sendSelected(entities.selected);
                    }}
                    disabled={entities.selected.length === 0}
                >
                    {'Send'}
                </Button>
            </div>
        </div>
	);
});
