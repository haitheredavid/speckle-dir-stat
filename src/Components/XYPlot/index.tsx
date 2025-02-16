import { AnimatedGrid, XYChart, AnimatedGlyphSeries } from '@visx/xychart';
import { FunctionComponent, useMemo } from 'react';
import { observer } from 'mobx-react';
import { EntityDot } from '~/stores/interfaces';
import { scaleLinear } from '@visx/scale';
import { AxisBottom, AxisLeft } from '@visx/axis';

export type XYProps = {
	items: EntityDot[];
	width: number;
	height: number;
	margin?: { top: number; right: number; bottom: number; left: number };
};

const XYPlot: FunctionComponent<XYProps> = (props) => {
	let xMax = 0;
	let xMin = 0;
	let yMax = 0;
	let yMin = 0;

	props.items.forEach((item) => {
		xMax = Math.max(xMax, item.x);
		xMin = Math.min(xMin, item.x);
		yMax = Math.max(yMax, item.y);
		yMin = Math.min(yMin, item.y);
	});

	console.log('x');
	console.log(xMin);
	console.log(xMax);

	console.log('y');
	console.log(yMin);
	console.log(yMax);

	const accessors = {
		xAccessor: (d: EntityDot) => (d.x - xMin) / (xMax - xMin),
		yAccessor: (d: EntityDot) => (d.y - yMin) / (yMax - yMin),
		size: (d: EntityDot) => 10,
	};

	const xScale = useMemo(
		() =>
			scaleLinear<number>({
				// range: [0, 300],
				round: true,
				domain: [xMin, xMax],
			}),
		[xMin, xMax]
	);

	const yScale = useMemo(
		() =>
			scaleLinear<number>({
				// range: [0, 300],
				round: true,
				domain: [yMin, yMax],
			}),
		[yMin, yMax]
	);

	console.log('XY Plot RENDER');

	return (
		<XYChart
			height={props.height}
			xScale={{ type: 'linear', domain: [0, 1], zero: false }}
			yScale={{ type: 'linear', domain: [0, 1], zero: false }}
		>
			<AxisLeft scale={yScale} orientation='left' label={'area'} />
			<AxisBottom scale={xScale} label={'area'} />
			<AnimatedGrid columns={true} numTicks={10} />
			<AnimatedGlyphSeries dataKey='Model' data={props.items} {...accessors} />
		</XYChart>
	);
};
export default observer(XYPlot);
