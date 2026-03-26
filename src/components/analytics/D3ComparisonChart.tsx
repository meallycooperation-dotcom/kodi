import { useEffect, useRef } from 'react';
import * as d3 from 'd3';

type ComparisonDatum = {
  label: string;
  value: number;
};

type D3ComparisonChartProps = {
  data: ComparisonDatum[];
  width?: number;
  height?: number;
};

const D3ComparisonChart = ({ data, width = 400, height = 230 }: D3ComparisonChartProps) => {
  const ref = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (!ref.current) return;

    const svg = d3.select(ref.current);
    svg.selectAll('*').remove();

    const margin = { top: 20, right: 20, bottom: 35, left: 60 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const svgGroup = svg
      .attr('viewBox', `0 0 ${width} ${height}`)
      .attr('preserveAspectRatio', 'xMidYMid meet')
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const xScale = d3
      .scaleBand()
      .domain(data.map((datum) => datum.label))
      .range([0, innerWidth])
      .padding(0.3);

    const maxValue = d3.max(data, (datum) => datum.value) ?? 0;
    const yScale = d3
      .scaleLinear()
      .domain([0, maxValue * 1.1])
      .nice()
      .range([innerHeight, 0]);

    svgGroup
      .append('g')
      .selectAll('rect')
      .data(data)
      .enter()
      .append('rect')
      .attr('x', (datum) => xScale(datum.label) ?? 0)
      .attr('y', (datum) => yScale(datum.value))
      .attr('width', xScale.bandwidth())
      .attr('height', (datum) => innerHeight - yScale(datum.value))
      .attr('fill', '#2563eb');

    svgGroup
      .append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(d3.axisBottom(xScale));

    svgGroup.append('g').call(d3.axisLeft(yScale).ticks(4));
  }, [data, height, width]);

  return (
    <div className="d3-chart">
      <svg ref={ref} role="img" aria-label="Comparison chart" />
    </div>
  );
};

export default D3ComparisonChart;
