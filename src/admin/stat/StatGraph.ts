import {ELG, SVG} from "element";


const periodMax = 96;
const graphSize = 5;
const graphWidth = periodMax * graphSize;
const graphHeight = Math.round(graphWidth * 0.75);
const graphPadding = 20;
const width = graphWidth + graphPadding;

export class StatGraph {
    container = SVG().width(width).height(graphHeight + graphPadding);
    private readonly data: number[][];
    private g4 = ELG('g');
    private textElem = ELG('text');

    constructor(data: number[][]) {
        this.data = data;
        this.init();
        this.draw();

        this.container.onMove(this.onMove.bind(this)).onLeave(this.onLeave.bind(this));
    }

    private onMove(_e: Event){
        const e = _e as MouseEvent;
        let user = 0, last = 0;

        let im = Math.round(e.offsetX / width * periodMax);
        for (let i = 0; i < im; i++) {
            last = this.data[i][0];
            user += last;
        }
        this.textElem.text(`Посетителей: ${user} [+${last}]`);
    }

    private onLeave(){
        this.textElem.text('');
    }

    private init() {
        const g1 = ELG('g')
            .attr('stroke', 'silver')
            .attr('stroke-width', '1')
            .attr('stroke-dasharray', '5,5');

        const g2 = ELG('g')
            .attr('stroke', 'black')
            .attr('stroke-width', '1');

        const g3 = ELG('g')
            .attr('fill', 'blue')
            .attr('font-size', '11px');

        this.container.append(
            g1, g2, g3, this.g4, this.textElem.attr('x', '0').attr('y', '20')
        );

        const hours = 24;

        const step = Math.floor(graphWidth / hours);

        for (let i = 0; i < hours; i++) {
            g1.append(
                ELG('line')
                    .attr('x1', i * step + step + graphPadding)
                    .attr('y1', 0)
                    .attr('x2', i * step + step + graphPadding)
                    .attr('y2', graphHeight)
            );
            g3.append(
                ELG('text')
                    .text(i)
                    .attr('x', i * step + 15)
                    .attr('y', graphHeight + 15)
            );
        }

        g1.append(
            ELG('line')
                .attr('x1', graphPadding)
                .attr('y1', 0)
                .attr('x2', graphPadding)
                .attr('y2', graphHeight)
        );

        g2.append(
            ELG('line')
                .attr('x1', graphPadding)
                .attr('y1', graphHeight)
                .attr('x2', graphWidth + graphPadding)
                .attr('y2', graphHeight)
        );
    }

    private draw(){

        this.g4.drop();

        const color = ['red', 'blue', 'green', 'yellow'];
        const step = Math.floor(graphWidth / this.data.length);

        for (let num = 0; num < 4; num++) {
            const points = [] as string[];
            let dataMax = 0;
            for (let i = 0; i < this.data.length; i++) {
                const val = this.data[i][num == 0 ? 1 : num];
                dataMax = dataMax > val ? dataMax : val;
            }

            for (let i = 0; i < this.data.length; i++) {
                points.push(
                    `${(i + 1) * step + graphPadding},${Math.floor(graphHeight * (1 - this.data[i][num] / dataMax))}`
                );
            }

            this.g4.append(
                ELG('polyline')
                    .attr('points', points.join(' '))
                    .attr('stroke', color[num])
                    .attr('fill', 'none')
                    .attr('stroke-width', '2')
                    .attr('opacity', 0.5)
            );
        }
    }
}