// Copyright © 2016, Numenta, Inc. Unless you have purchased from
// Numenta, Inc. a separate commercial license for this software code, the
// following terms and conditions apply:
//
// This program is free software: you can redistribute it and/or modify it under
// the terms of the GNU Affero Public License version 3 as published by the
// Free Software Foundation.
//
// This program is distributed in the hope that it will be useful, but WITHOUT
// ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS
// FOR A PARTICULAR PURPOSE. See the GNU Affero Public License for more details.
//
// You should have received a copy of the GNU Affero Public License along with
// this program. If not, see http://www.gnu.org/licenses.
//
// http://numenta.org/licenses/

/* eslint-disable max-statements */

import moment from 'moment';
import RGBColor from 'rgbcolor';
import d3 from 'd3';

import {formatDisplayValue} from '../browser-utils';


/**
 * DyGraph Custom Chart Underlay: On-chart X and Y Axes Labels and Markers,
 *  via customzing Dygraph's Underlay Callback. Text rendered via
 *  DOM `<canvas>` API.
 * @param {Object} context - Chart.jsx component context.
 * @param {Object} canvas - DOM Canvas object to draw with, from Dygraphs.
 * @param {Object} area - Canvas drawing area metadata, Width x Height info etc.
 * @param {Object} dygraph - Instantiated Dygraph library object itself.
 * @requries Dygraphs
 * @see view-source:http://dygraphs.com/tests/underlay-callback.html
 */
export default function (context, canvas, area, dygraph) {
  const muiTheme = context.context.muiTheme.rawTheme;
  const yLabels = 4;
  const pad = 10;
  const yFactor = area.h / (yLabels - 1);
  const yAxisRange = dygraph.yAxisRange();
  const yRangeWidth = yAxisRange[1] - yAxisRange[0];
  let yValues = Array.from(yAxisRange);


  // --- Custom Y axis and labels (on left) ---

  // prep Y value labels
  for (let y=1; y<(yLabels - 1); y++) {
    let multiplier = y / (yLabels - 1);
    let value = yAxisRange[0] + (yRangeWidth * multiplier);
    yValues.splice(y, 0, value);
  }

  // draw Y axis line
  canvas.beginPath();
  canvas.lineWidth = 2;
  canvas.strokeStyle = new RGBColor(muiTheme.palette.accent3Color).toRGB();
  canvas.moveTo(area.x, area.y);
  canvas.lineTo(area.x, area.y + area.h);  // y axis left
  canvas.stroke();

  // draw left-side Y axis labels
  canvas.font = '12px Roboto';
  canvas.fillStyle = new RGBColor(muiTheme.palette.accent3Color).toRGB();
  for (let y=0; y<yValues.length; y++) {
    let yHeight = area.h - (y * yFactor);
    let value = formatDisplayValue(yValues[y]);

    if (y === yValues.length - 1) {
      yHeight += pad;  // bring down top label to make visible
    } else if (y === 0) {
      yHeight--;  // visual: push bottom label pixel spacing a bit
    } else {
      yHeight += (pad/2);  // visual: slight vertical padding
    }

    canvas.fillText(value, area.x + (pad/2), area.y + yHeight);
  }


  // --- Custom X axis and labels and markers (along top) ---
  canvas.font = '11px Roboto';
  canvas.lineWidth = 1;
  canvas.fillStyle = new RGBColor(muiTheme.palette.disabledColor).toRGB();
  canvas.strokeStyle = new RGBColor(muiTheme.palette.disabledColor).toRGB();

  let timeScale = d3.time.scale.utc()
        .domain(context._xScale.domain())
        .range(context._xScale.range());

  let ticks = timeScale.ticks(5);

  // Don't show times if every tick is at midnight.
  let printTime = ticks.some(
    (tick) => moment.utc(tick).format('HH:mm:ss.SSSSSS') !== '00:00:00.000000'
  );

  let xPrevious = Infinity;
  ticks.reverse().forEach((tick) => {
    let x = area.x + timeScale(tick);

    // Make room for y axis labels.
    if (x < 70) return;

    // Sometimes two ticks are oddly close together, e.g. when there's
    // a tick "the first of every month, and every two days" the ticks
    // include October 29th, October 31st, and November 1st. In these
    // cases, if this 1-day interval is too narrow to draw labels, we
    // exclude the October 31st tick. This extra non-d3 logic is
    // necessary because the design of our labels.
    if (xPrevious - x < 70) return;

    let when = moment.utc(tick);
    let date = when.format('ll');
    let time = when.format('LT');

    // draw x axis label
    canvas.fillText(date, x + (pad/2), area.y + pad);
    if (printTime) {
      canvas.fillText(time, x + (pad/2), area.y + (pad*2)+3);
    }

    // draw thin x axis label vertical marker line
    canvas.beginPath();
    canvas.moveTo(x, area.y);
    canvas.lineTo(x, area.y + area.h);
    canvas.stroke();

    xPrevious = x;
  });
}
