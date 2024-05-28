/*
 * SPDX-FileCopyrightText: 2023 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
import { ChangeDetectionStrategy, Component, ElementRef, Inject, Input, ViewChild, } from '@angular/core';
import { Chart } from 'chart.js/auto';
import { PIA_CHARTS_CONFIGURATION } from '../pia-charts-configuration.token';
import { ColorPaletteUtility } from '../utilities/color-palette.utility';
import * as i0 from "@angular/core";
export class ChartComponent {
    constructor(globalConfig) {
        this.globalConfig = globalConfig;
        this.chart = null;
        this.canvas = null;
    }
    ngOnChanges(changes) {
        if (this.chart !== null) {
            this.prepareChartConfiguration();
            this.chart.data = this.config.data;
            this.chart.update();
        }
    }
    ngAfterViewInit() {
        this.prepareChartConfiguration();
        this.chart = new Chart(this.canvas?.nativeElement, this.config);
    }
    prepareChartConfiguration() {
        this.applyColorsToDataSets();
        this.applyPluginConfigurations();
        this.applyResponsiveConfiguration();
    }
    applyColorsToDataSets() {
        if (this.config.data.datasets.length === 0) {
            return;
        }
        let transformer;
        switch (this.config.type) {
            case 'bar':
                transformer = (dataset, i) => {
                    dataset.backgroundColor = ColorPaletteUtility.getColorForIterator(i);
                    return dataset;
                };
                break;
            case 'line':
                transformer = (dataset, i) => {
                    dataset.borderColor = ColorPaletteUtility.getColorForIterator(i);
                    dataset.backgroundColor = dataset.borderColor;
                    return dataset;
                };
                break;
            default:
                throw new Error('Unsupported chart type: ' + this.config.type);
        }
        this.config.data.datasets = this.config.data.datasets.map((dataset, index) => 
        // don't override colors
        dataset.backgroundColor ? dataset : transformer(dataset, index));
    }
    applyPluginConfigurations() {
        if (this.globalConfig.legend) {
            this.configurePlugin('legend', this.globalConfig.legend);
        }
        if (this.globalConfig.tooltip) {
            this.configurePlugin('tooltip', this.globalConfig.tooltip);
        }
    }
    applyResponsiveConfiguration() {
        this.config = {
            ...this.config,
            options: {
                ...this.config.options,
                maintainAspectRatio: false,
            },
        };
    }
    configurePlugin(key, pluginConfig) {
        this.config = {
            ...this.config,
            options: {
                ...this.config.options,
                plugins: {
                    ...(this.config.options?.plugins ? this.config.options.plugins : {}),
                    [key]: {
                        ...(typeof this.config.options?.plugins === 'object' &&
                            key in this.config.options.plugins
                            ? this.config.options.plugins[key]
                            : {}),
                        ...pluginConfig,
                    },
                },
            },
        };
    }
    static { this.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "17.3.5", ngImport: i0, type: ChartComponent, deps: [{ token: PIA_CHARTS_CONFIGURATION }], target: i0.ɵɵFactoryTarget.Component }); }
    static { this.ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "14.0.0", version: "17.3.5", type: ChartComponent, selector: "pia-chart", inputs: { config: "config" }, viewQueries: [{ propertyName: "canvas", first: true, predicate: ["canvas"], descendants: true, read: ElementRef }], usesOnChanges: true, ngImport: i0, template: "<!--\n  ~ SPDX-FileCopyrightText: 2023 Helmholtz-Zentrum f\u00FCr Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>\n  ~\n  ~ SPDX-License-Identifier: AGPL-3.0-or-later\n  -->\n\n<canvas #canvas></canvas>\n", styles: [":host{display:block;width:100%;height:100%;position:relative;overflow:auto}\n"], changeDetection: i0.ChangeDetectionStrategy.OnPush }); }
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "17.3.5", ngImport: i0, type: ChartComponent, decorators: [{
            type: Component,
            args: [{ selector: 'pia-chart', changeDetection: ChangeDetectionStrategy.OnPush, template: "<!--\n  ~ SPDX-FileCopyrightText: 2023 Helmholtz-Zentrum f\u00FCr Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>\n  ~\n  ~ SPDX-License-Identifier: AGPL-3.0-or-later\n  -->\n\n<canvas #canvas></canvas>\n", styles: [":host{display:block;width:100%;height:100%;position:relative;overflow:auto}\n"] }]
        }], ctorParameters: () => [{ type: undefined, decorators: [{
                    type: Inject,
                    args: [PIA_CHARTS_CONFIGURATION]
                }] }], propDecorators: { config: [{
                type: Input
            }], canvas: [{
                type: ViewChild,
                args: ['canvas', { read: ElementRef }]
            }] } });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2hhcnQuY29tcG9uZW50LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vcHJvamVjdHMvbGliL3NyYy9saWIvY2hhcnQvY2hhcnQuY29tcG9uZW50LnRzIiwiLi4vLi4vLi4vLi4vcHJvamVjdHMvbGliL3NyYy9saWIvY2hhcnQvY2hhcnQuY29tcG9uZW50Lmh0bWwiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7R0FJRztBQUVILE9BQU8sRUFFTCx1QkFBdUIsRUFDdkIsU0FBUyxFQUNULFVBQVUsRUFDVixNQUFNLEVBQ04sS0FBSyxFQUdMLFNBQVMsR0FDVixNQUFNLGVBQWUsQ0FBQztBQUV2QixPQUFPLEVBQUUsS0FBSyxFQUFpQyxNQUFNLGVBQWUsQ0FBQztBQUdyRSxPQUFPLEVBQUUsd0JBQXdCLEVBQUUsTUFBTSxtQ0FBbUMsQ0FBQztBQUM3RSxPQUFPLEVBQUUsbUJBQW1CLEVBQUUsTUFBTSxvQ0FBb0MsQ0FBQzs7QUFRekUsTUFBTSxPQUFPLGNBQWM7SUFRekIsWUFFUyxZQUFpQztRQUFqQyxpQkFBWSxHQUFaLFlBQVksQ0FBcUI7UUFQbkMsVUFBSyxHQUE0QixJQUFJLENBQUM7UUFHNUIsV0FBTSxHQUFzQixJQUFJLENBQUM7SUFLL0MsQ0FBQztJQUVHLFdBQVcsQ0FBQyxPQUFzQjtRQUN2QyxJQUFJLElBQUksQ0FBQyxLQUFLLEtBQUssSUFBSSxFQUFFLENBQUM7WUFDeEIsSUFBSSxDQUFDLHlCQUF5QixFQUFFLENBQUM7WUFDakMsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUM7WUFDbkMsSUFBSSxDQUFDLEtBQUssQ0FBQyxNQUFNLEVBQUUsQ0FBQztRQUN0QixDQUFDO0lBQ0gsQ0FBQztJQUVNLGVBQWU7UUFDcEIsSUFBSSxDQUFDLHlCQUF5QixFQUFFLENBQUM7UUFFakMsSUFBSSxDQUFDLEtBQUssR0FBRyxJQUFJLEtBQUssQ0FBQyxJQUFJ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Q0FBQyxFQUFFLENBQUM7b0JBQ3BFLENBQUMsR0FBRyxDQUFDLEVBQUU7d0JBQ0wsR0FBRyxDQUFDLE9BQU8sSUFBSSxDQUFDLE1BQU0sQ0FBQyxPQUFPLEVBQUUsT0FBTyxLQUFLLFFBQVE7NEJBQ3BELEdBQUcsSUFBSSxJQUFJLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxPQUFPOzRCQUNoQyxDQUFDLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQzs0QkFDbEMsQ0FBQyxDQUFDLEVBQUUsQ0FBQzt3QkFDUCxHQUFHLFlBQVk7cUJBQ2hCO2lCQUNGO2FBQ0Y7U0FDRixDQUFDO0lBQ0osQ0FBQzs4R0E5R1UsY0FBYyxrQkFTZix3QkFBd0I7a0dBVHZCLGNBQWMsNEpBS0ksVUFBVSxrRENuQ3pDLHdOQU9BOzsyRkR1QmEsY0FBYztrQkFOMUIsU0FBUzsrQkFDRSxXQUFXLG1CQUdKLHVCQUF1QixDQUFDLE1BQU07OzBCQVc1QyxNQUFNOzJCQUFDLHdCQUF3Qjt5Q0FQM0IsTUFBTTtzQkFEWixLQUFLO2dCQUtXLE1BQU07c0JBRHRCLFNBQVM7dUJBQUMsUUFBUSxFQUFFLEVBQUUsSUFBSSxFQUFFLFVBQVUsRUFBRSIsInNvdXJjZXNDb250ZW50IjpbIi8qXG4gKiBTUERYLUZpbGVDb3B5cmlnaHRUZXh0OiAyMDIzIEhlbG1ob2x0ei1aZW50cnVtIGbDvHIgSW5mZWt0aW9uc2ZvcnNjaHVuZyBHbWJIIChIWkkpIDxQaWFQb3N0QGhlbG1ob2x0ei1oemkuZGU+XG4gKlxuICogU1BEWC1MaWNlbnNlLUlkZW50aWZpZXI6IEFHUEwtMy4wLW9yLWxhdGVyXG4gKi9cblxuaW1wb3J0IHtcbiAgQWZ0ZXJWaWV3SW5pdCxcbiAgQ2hhbmdlRGV0ZWN0aW9uU3RyYXRlZ3ksXG4gIENvbXBvbmVudCxcbiAgRWxlbWVudFJlZixcbiAgSW5qZWN0LFxuICBJbnB1dCxcbiAgT25DaGFuZ2VzLFxuICBTaW1wbGVDaGFuZ2VzLFxuICBWaWV3Q2hpbGQsXG59IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0IHsgQ2hhcnREYXRhc2V0IH0gZnJvbSAnY2hhcnQuanMnO1xuaW1wb3J0IHsgQ2hhcnQsIENoYXJ0Q29uZmlndXJhdGlvbiwgQ2hhcnRUeXBlIH0gZnJvbSAnY2hhcnQuanMvYXV0byc7XG5pbXBvcnQgeyBQbHVnaW5PcHRpb25zQnlUeXBlIH0gZnJvbSAnY2hhcnQuanMvZGlzdC90eXBlcyc7XG5pbXBvcnQgeyBDaGFydHNDb25maWd1cmF0aW9uIH0gZnJvbSAnLi4vbW9kZWxzJztcbmltcG9ydCB7IFBJQV9DSEFSVFNfQ09ORklHVVJBVElPTiB9IGZyb20gJy4uL3BpYS1jaGFydHMtY29uZmlndXJhdGlvbi50b2tlbic7XG5pbXBvcnQgeyBDb2xvclBhbGV0dGVVdGlsaXR5IH0gZnJvbSAnLi4vdXRpbGl0aWVzL2NvbG9yLXBhbGV0dGUudXRpbGl0eSc7XG5cbkBDb21wb25lbnQoe1xuICBzZWxlY3RvcjogJ3BpYS1jaGFydCcsXG4gIHRlbXBsYXRlVXJsOiAnLi9jaGFydC5jb21wb25lbnQuaHRtbCcsXG4gIHN0eWxlVXJsczogWycuL2NoYXJ0LmNvbXBvbmVudC5jc3MnXSxcbiAgY2hhbmdlRGV0ZWN0aW9uOiBDaGFuZ2VEZXRlY3Rpb25TdHJhdGVneS5PblB1c2gsXG59KVxuZXhwb3J0IGNsYXNzIENoYXJ0Q29tcG9uZW50IGltcGxlbWVudHMgT25DaGFuZ2VzLCBBZnRlclZpZXdJbml0IHtcbiAgQElucHV0KClcbiAgcHVibGljIGNvbmZpZyE6IENoYXJ0Q29uZmlndXJhdGlvbjxDaGFydFR5cGU+O1xuICBwdWJsaWMgY2hhcnQ6IENoYXJ0PENoYXJ0VHlwZT4gfCBudWxsID0gbnVsbDtcblxuICBAVmlld0NoaWxkKCdjYW52YXMnLCB7IHJlYWQ6IEVsZW1lbnRSZWYgfSlcbiAgcHJpdmF0ZSByZWFkb25seSBjYW52YXM6IEVsZW1lbnRSZWYgfCBudWxsID0gbnVsbDtcblxuICBwdWJsaWMgY29uc3RydWN0b3IoXG4gICAgQEluamVjdChQSUFfQ0hBUlRTX0NPTkZJR1VSQVRJT04pXG4gICAgcHVibGljIGdsb2JhbENvbmZpZzogQ2hhcnRzQ29uZmlndXJhdGlvblxuICApIHt9XG5cbiAgcHVibGljIG5nT25DaGFuZ2VzKGNoYW5nZXM6IFNpbXBsZUNoYW5nZXMpOiB2b2lkIHtcbiAgICBpZiAodGhpcy5jaGFydCAhPT0gbnVsbCkge1xuICAgICAgdGhpcy5wcmVwYXJlQ2hhcnRDb25maWd1cmF0aW9uKCk7XG4gICAgICB0aGlzLmNoYXJ0LmRhdGEgPSB0aGlzLmNvbmZpZy5kYXRhO1xuICAgICAgdGhpcy5jaGFydC51cGRhdGUoKTtcbiAgICB9XG4gIH1cblxuICBwdWJsaWMgbmdBZnRlclZpZXdJbml0KCk6IHZvaWQge1xuICAgIHRoaXMucHJlcGFyZUNoYXJ0Q29uZmlndXJhdGlvbigpO1xuXG4gICAgdGhpcy5jaGFydCA9IG5ldyBDaGFydCh0aGlzLmNhbnZhcz8ubmF0aXZlRWxlbWVudCwgdGhpcy5jb25maWcpO1xuICB9XG5cbiAgcHJpdmF0ZSBwcmVwYXJlQ2hhcnRDb25maWd1cmF0aW9uKCk6IHZvaWQge1xuICAgIHRoaXMuYXBwbHlDb2xvcnNUb0RhdGFTZXRzKCk7XG4gICAgdGhpcy5hcHBseVBsdWdpbkNvbmZpZ3VyYXRpb25zKCk7XG4gICAgdGhpcy5hcHBseVJlc3BvbnNpdmVDb25maWd1cmF0aW9uKCk7XG4gIH1cblxuICBwcml2YXRlIGFwcGx5Q29sb3JzVG9EYXRhU2V0cygpOiB2b2lkIHtcbiAgICBpZiAodGhpcy5jb25maWcuZGF0YS5kYXRhc2V0cy5sZW5ndGggPT09IDApIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBsZXQgdHJhbnNmb3JtZXI6IChcbiAgICAgIGRhdGFzZXQ6IENoYXJ0RGF0YXNldDxDaGFydFR5cGU+LFxuICAgICAgaW5kZXg6IG51bWJlclxuICAgICkgPT4gQ2hhcnREYXRhc2V0PENoYXJ0VHlwZT47XG5cbiAgICBzd2l0Y2ggKHRoaXMuY29uZmlnLnR5cGUpIHtcbiAgICAgIGNhc2UgJ2Jhcic6XG4gICAgICAgIHRyYW5zZm9ybWVyID0gKGRhdGFzZXQsIGkpID0+IHtcbiAgICAgICAgICBkYXRhc2V0LmJhY2tncm91bmRDb2xvciA9IENvbG9yUGFsZXR0ZVV0aWxpdHkuZ2V0Q29sb3JGb3JJdGVyYXRvcihpKTtcbiAgICAgICAgICByZXR1cm4gZGF0YXNldDtcbiAgICAgICAgfTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlICdsaW5lJzpcbiAgICAgICAgdHJhbnNmb3JtZXIgPSAoZGF0YXNldCwgaSkgPT4ge1xuICAgICAgICAgIGRhdGFzZXQuYm9yZGVyQ29sb3IgPSBDb2xvclBhbGV0dGVVdGlsaXR5LmdldENvbG9yRm9ySXRlcmF0b3IoaSk7XG4gICAgICAgICAgZGF0YXNldC5iYWNrZ3JvdW5kQ29sb3IgPSBkYXRhc2V0LmJvcmRlckNvbG9yO1xuICAgICAgICAgIHJldHVybiBkYXRhc2V0O1xuICAgICAgICB9O1xuICAgICAgICBicmVhaztcbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignVW5zdXBwb3J0ZWQgY2hhcnQgdHlwZTogJyArIHRoaXMuY29uZmlnLnR5cGUpO1xuICAgIH1cblxuICAgIHRoaXMuY29uZmlnLmRhdGEuZGF0YXNldHMgPSB0aGlzLmNvbmZpZy5kYXRhLmRhdGFzZXRzLm1hcChcbiAgICAgIChkYXRhc2V0LCBpbmRleCkgPT5cbiAgICAgICAgLy8gZG9uJ3Qgb3ZlcnJpZGUgY29sb3JzXG4gICAgICAgIGRhdGFzZXQuYmFja2dyb3VuZENvbG9yID8gZGF0YXNldCA6IHRyYW5zZm9ybWVyKGRhdGFzZXQsIGluZGV4KVxuICAgICk7XG4gIH1cblxuICBwcml2YXRlIGFwcGx5UGx1Z2luQ29uZmlndXJhdGlvbnMoKSB7XG4gICAgaWYgKHRoaXMuZ2xvYmFsQ29uZmlnLmxlZ2VuZCkge1xuICAgICAgdGhpcy5jb25maWd1cmVQbHVnaW4oJ2xlZ2VuZCcsIHRoaXMuZ2xvYmFsQ29uZmlnLmxlZ2VuZCk7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuZ2xvYmFsQ29uZmlnLnRvb2x0aXApIHtcbiAgICAgIHRoaXMuY29uZmlndXJlUGx1Z2luKCd0b29sdGlwJywgdGhpcy5nbG9iYWxDb25maWcudG9vbHRpcCk7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBhcHBseVJlc3BvbnNpdmVDb25maWd1cmF0aW9uKCk6IHZvaWQge1xuICAgIHRoaXMuY29uZmlnID0ge1xuICAgICAgLi4udGhpcy5jb25maWcsXG4gICAgICBvcHRpb25zOiB7XG4gICAgICAgIC4uLnRoaXMuY29uZmlnLm9wdGlvbnMsXG4gICAgICAgIG1haW50YWluQXNwZWN0UmF0aW86IGZhbHNlLFxuICAgICAgfSxcbiAgICB9O1xuICB9XG5cbiAgcHJpdmF0ZSBjb25maWd1cmVQbHVnaW4oXG4gICAga2V5OiBrZXlvZiBQbHVnaW5PcHRpb25zQnlUeXBlPENoYXJ0VHlwZT4sXG4gICAgcGx1Z2luQ29uZmlnOiBQYXJ0aWFsPFxuICAgICAgUGx1Z2luT3B0aW9uc0J5VHlwZTxDaGFydFR5cGU+W2tleW9mIFBsdWdpbk9wdGlvbnNCeVR5cGU8Q2hhcnRUeXBlPl1cbiAgICA+XG4gICkge1xuICAgIHRoaXMuY29uZmlnID0ge1xuICAgICAgLi4udGhpcy5jb25maWcsXG4gICAgICBvcHRpb25zOiB7XG4gICAgICAgIC4uLnRoaXMuY29uZmlnLm9wdGlvbnMsXG4gICAgICAgIHBsdWdpbnM6IHtcbiAgICAgICAgICAuLi4odGhpcy5jb25maWcub3B0aW9ucz8ucGx1Z2lucyA/IHRoaXMuY29uZmlnLm9wdGlvbnMucGx1Z2lucyA6IHt9KSxcbiAgICAgICAgICBba2V5XToge1xuICAgICAgICAgICAgLi4uKHR5cGVvZiB0aGlzLmNvbmZpZy5vcHRpb25zPy5wbHVnaW5zID09PSAnb2JqZWN0JyAmJlxuICAgICAgICAgICAga2V5IGluIHRoaXMuY29uZmlnLm9wdGlvbnMucGx1Z2luc1xuICAgICAgICAgICAgICA/IHRoaXMuY29uZmlnLm9wdGlvbnMucGx1Z2luc1trZXldXG4gICAgICAgICAgICAgIDoge30pLFxuICAgICAgICAgICAgLi4ucGx1Z2luQ29uZmlnLFxuICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICB9LFxuICAgIH07XG4gIH1cbn1cbiIsIjwhLS1cbiAgfiBTUERYLUZpbGVDb3B5cmlnaHRUZXh0OiAyMDIzIEhlbG1ob2x0ei1aZW50cnVtIGbDvHIgSW5mZWt0aW9uc2ZvcnNjaHVuZyBHbWJIIChIWkkpIDxQaWFQb3N0QGhlbG1ob2x0ei1oemkuZGU+XG4gIH5cbiAgfiBTUERYLUxpY2Vuc2UtSWRlbnRpZmllcjogQUdQTC0zLjAtb3ItbGF0ZXJcbiAgLS0+XG5cbjxjYW52YXMgI2NhbnZhcz48L2NhbnZhcz5cbiJdfQ==