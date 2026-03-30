import { jsx as _jsx } from "react/jsx-runtime";
import { useEffect, useMemo, useRef } from 'react';
import * as d3 from 'd3';
import { useCurrency } from '../../context/currency';
const colors = {
    collected: '#2563eb',
    arrears: '#f97316',
    expected: '#10b981'
};
const MonthlyRevenueChart = ({ data, width = 600, height = 320 }) => {
    const ref = useRef(null);
    const { formatCurrency } = useCurrency();
    const preparedData = useMemo(() => {
        const parseMonth = d3.timeParse('%Y-%m');
        return (data
            .map((row) => {
            const parsed = parseMonth(row.month) ?? new Date(row.month);
            return { ...row, date: parsed };
        })
            .filter((row) => !Number.isNaN(row.date.getTime()))
            .sort((a, b) => a.date.getTime() - b.date.getTime())
            .slice(-8));
    }, [data]);
    useEffect(() => {
        if (!ref.current)
            return;
        const svg = d3.select(ref.current);
        svg.selectAll('*').remove();
        if (!preparedData.length) {
            svg
                .attr('viewBox', `0 0 ${width} ${height}`)
                .append('text')
                .attr('x', width / 2)
                .attr('y', height / 2)
                .attr('text-anchor', 'middle')
                .attr('dominant-baseline', 'middle')
                .text('No revenue history yet');
            return;
        }
        const margin = { top: 20, right: 100, bottom: 50, left: 60 };
        const innerWidth = width - margin.left - margin.right;
        const innerHeight = height - margin.top - margin.bottom;
        const group = svg
            .attr('viewBox', `0 0 ${width} ${height}`)
            .attr('preserveAspectRatio', 'xMidYMid meet')
            .append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);
        const xExtent = d3.extent(preparedData, (d) => d.date);
        const [minDate, maxDate] = +xExtent[0] === +xExtent[1]
            ? [d3.timeDay.offset(xExtent[0], -14), d3.timeDay.offset(xExtent[1], 14)]
            : xExtent;
        const xScale = d3.scaleTime().domain([minDate, maxDate]).range([0, innerWidth]);
        const maxValue = d3.max(preparedData, (row) => Math.max(row.collected_revenue, row.total_arrears, row.expected_revenue)) ?? 0;
        const yScale = d3.scaleLinear().domain([0, maxValue * 1.1]).nice().range([innerHeight, 0]);
        group
            .append('g')
            .attr('transform', `translate(0,${innerHeight})`)
            .call(d3.axisBottom(xScale).ticks(preparedData.length).tickFormat((d, i) => d3.timeFormat('%b %y')(d)))
            .selectAll('text')
            .attr('dx', '-0.5em')
            .attr('dy', '0.3em')
            .attr('transform', 'rotate(-35)')
            .style('text-anchor', 'end');
        group.append('g').call(d3.axisLeft(yScale).ticks(4).tickFormat((value) => formatCurrency(Number(value))));
        const lineFactory = (key) => d3
            .line()
            .x((datum) => xScale(datum.date))
            .y((datum) => yScale(datum[key]));
        group
            .append('path')
            .datum(preparedData)
            .attr('d', lineFactory('collected_revenue'))
            .attr('fill', 'none')
            .attr('stroke', colors.collected)
            .attr('stroke-width', 2.5);
        group
            .append('path')
            .datum(preparedData)
            .attr('d', lineFactory('total_arrears'))
            .attr('fill', 'none')
            .attr('stroke', colors.arrears)
            .attr('stroke-width', 2.5)
            .attr('stroke-dasharray', '4 6');
        group
            .append('path')
            .datum(preparedData)
            .attr('d', lineFactory('expected_revenue'))
            .attr('fill', 'none')
            .attr('stroke', colors.expected)
            .attr('stroke-width', 1.8)
            .attr('stroke-dasharray', '2 4');
        const annotateSeries = (key, color) => {
            group
                .append('g')
                .selectAll('circle')
                .data(preparedData)
                .enter()
                .append('circle')
                .attr('cx', (datum) => xScale(datum.date))
                .attr('cy', (datum) => yScale(datum[key]))
                .attr('r', 3.5)
                .attr('fill', color)
                .attr('stroke', '#fff')
                .attr('stroke-width', 1);
        };
        annotateSeries('collected_revenue', colors.collected);
        annotateSeries('total_arrears', colors.arrears);
        annotateSeries('expected_revenue', colors.expected);
        const legend = svg
            .append('g')
            .attr('transform', `translate(${width - margin.right + 20},${margin.top})`);
        const legendItems = [
            { label: 'Collected', color: colors.collected },
            { label: 'Arrears', color: colors.arrears },
            { label: 'Expected', color: colors.expected }
        ];
        legendItems.forEach((item, index) => {
            const y = index * 20;
            legend
                .append('circle')
                .attr('cx', 0)
                .attr('cy', y)
                .attr('r', 4)
                .attr('fill', item.color);
            legend
                .append('text')
                .attr('x', 10)
                .attr('y', y + 4)
                .attr('font-size', 12)
                .text(item.label);
        });
    }, [preparedData, height, width]);
    return (_jsx("div", { className: "w-full", children: _jsx("svg", { ref: ref, role: "img", "aria-label": "Monthly revenue timeline" }) }));
};
export default MonthlyRevenueChart;
