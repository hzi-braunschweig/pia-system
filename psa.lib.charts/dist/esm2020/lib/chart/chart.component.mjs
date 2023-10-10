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
}
ChartComponent.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "14.2.12", ngImport: i0, type: ChartComponent, deps: [{ token: PIA_CHARTS_CONFIGURATION }], target: i0.ɵɵFactoryTarget.Component });
ChartComponent.ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "14.0.0", version: "14.2.12", type: ChartComponent, selector: "pia-chart", inputs: { config: "config" }, viewQueries: [{ propertyName: "canvas", first: true, predicate: ["canvas"], descendants: true, read: ElementRef }], usesOnChanges: true, ngImport: i0, template: "<!--\n  ~ SPDX-FileCopyrightText: 2023 Helmholtz-Zentrum f\u00FCr Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>\n  ~\n  ~ SPDX-License-Identifier: AGPL-3.0-or-later\n  -->\n\n<canvas #canvas></canvas>\n", styles: [":host{display:block;width:100%;height:100%;position:relative;overflow:auto}\n"], changeDetection: i0.ChangeDetectionStrategy.OnPush });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "14.2.12", ngImport: i0, type: ChartComponent, decorators: [{
            type: Component,
            args: [{ selector: 'pia-chart', changeDetection: ChangeDetectionStrategy.OnPush, template: "<!--\n  ~ SPDX-FileCopyrightText: 2023 Helmholtz-Zentrum f\u00FCr Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>\n  ~\n  ~ SPDX-License-Identifier: AGPL-3.0-or-later\n  -->\n\n<canvas #canvas></canvas>\n", styles: [":host{display:block;width:100%;height:100%;position:relative;overflow:auto}\n"] }]
        }], ctorParameters: function () { return [{ type: undefined, decorators: [{
                    type: Inject,
                    args: [PIA_CHARTS_CONFIGURATION]
                }] }]; }, propDecorators: { config: [{
                type: Input
            }], canvas: [{
                type: ViewChild,
                args: ['canvas', { read: ElementRef }]
            }] } });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2hhcnQuY29tcG9uZW50LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vcHJvamVjdHMvbGliL3NyYy9saWIvY2hhcnQvY2hhcnQuY29tcG9uZW50LnRzIiwiLi4vLi4vLi4vLi4vcHJvamVjdHMvbGliL3NyYy9saWIvY2hhcnQvY2hhcnQuY29tcG9uZW50Lmh0bWwiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7R0FJRztBQUVILE9BQU8sRUFFTCx1QkFBdUIsRUFDdkIsU0FBUyxFQUNULFVBQVUsRUFDVixNQUFNLEVBQ04sS0FBSyxFQUdMLFNBQVMsR0FDVixNQUFNLGVBQWUsQ0FBQztBQUV2QixPQUFPLEVBQUUsS0FBSyxFQUFpQyxNQUFNLGVBQWUsQ0FBQztBQUdyRSxPQUFPLEVBQUUsd0JBQXdCLEVBQUUsTUFBTSxtQ0FBbUMsQ0FBQztBQUM3RSxPQUFPLEVBQUUsbUJBQW1CLEVBQUUsTUFBTSxvQ0FBb0MsQ0FBQzs7QUFRekUsTUFBTSxPQUFPLGNBQWM7SUFRekIsWUFFUyxZQUFpQztRQUFqQyxpQkFBWSxHQUFaLFlBQVksQ0FBcUI7UUFQbkMsVUFBSyxHQUE0QixJQUFJLENBQUM7UUFHNUIsV0FBTSxHQUFzQixJQUFJLENBQUM7SUFLL0MsQ0FBQztJQUVHLFdBQVcsQ0FBQyxPQUFzQjtRQUN2QyxJQUFJLElBQUksQ0FBQyxLQUFLLEtBQUssSUFBSSxFQUFFO1lBQ3ZCLElBQUksQ0FBQyx5QkFBeUIsRUFBRSxDQUFDO1lBQ2pDLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDO1lBQ25DLElBQUksQ0FBQyxLQUFLLENBQUMsTUFBTSxFQUFFLENBQUM7U0FDckI7SUFDSCxDQUFDO0lBRU0sZUFBZTtRQUNwQixJQUFJLENBQUMseUJBQXlCLEVBQUUsQ0FBQztRQUVqQyxJQUFJLENBQUMsS0FBSyxHQUFHLElBQUksS0FBSyxDQUFDLElBQUksQ0FBQyxNQUFN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QUcsQ0FBQyxPQUFPLElBQUksQ0FBQyxNQUFNLENBQUMsT0FBTyxFQUFFLE9BQU8sS0FBSyxRQUFROzRCQUNwRCxHQUFHLElBQUksSUFBSSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsT0FBTzs0QkFDaEMsQ0FBQyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUM7NEJBQ2xDLENBQUMsQ0FBQyxFQUFFLENBQUM7d0JBQ1AsR0FBRyxZQUFZO3FCQUNoQjtpQkFDRjthQUNGO1NBQ0YsQ0FBQztJQUNKLENBQUM7OzRHQTlHVSxjQUFjLGtCQVNmLHdCQUF3QjtnR0FUdkIsY0FBYyw0SkFLSSxVQUFVLGtEQ25DekMsd05BT0E7NEZEdUJhLGNBQWM7a0JBTjFCLFNBQVM7K0JBQ0UsV0FBVyxtQkFHSix1QkFBdUIsQ0FBQyxNQUFNOzswQkFXNUMsTUFBTTsyQkFBQyx3QkFBd0I7NENBUDNCLE1BQU07c0JBRFosS0FBSztnQkFLVyxNQUFNO3NCQUR0QixTQUFTO3VCQUFDLFFBQVEsRUFBRSxFQUFFLElBQUksRUFBRSxVQUFVLEVBQUUiLCJzb3VyY2VzQ29udGVudCI6WyIvKlxuICogU1BEWC1GaWxlQ29weXJpZ2h0VGV4dDogMjAyMyBIZWxtaG9sdHotWmVudHJ1bSBmw7xyIEluZmVrdGlvbnNmb3JzY2h1bmcgR21iSCAoSFpJKSA8UGlhUG9zdEBoZWxtaG9sdHotaHppLmRlPlxuICpcbiAqIFNQRFgtTGljZW5zZS1JZGVudGlmaWVyOiBBR1BMLTMuMC1vci1sYXRlclxuICovXG5cbmltcG9ydCB7XG4gIEFmdGVyVmlld0luaXQsXG4gIENoYW5nZURldGVjdGlvblN0cmF0ZWd5LFxuICBDb21wb25lbnQsXG4gIEVsZW1lbnRSZWYsXG4gIEluamVjdCxcbiAgSW5wdXQsXG4gIE9uQ2hhbmdlcyxcbiAgU2ltcGxlQ2hhbmdlcyxcbiAgVmlld0NoaWxkLFxufSBmcm9tICdAYW5ndWxhci9jb3JlJztcbmltcG9ydCB7IENoYXJ0RGF0YXNldCB9IGZyb20gJ2NoYXJ0LmpzJztcbmltcG9ydCB7IENoYXJ0LCBDaGFydENvbmZpZ3VyYXRpb24sIENoYXJ0VHlwZSB9IGZyb20gJ2NoYXJ0LmpzL2F1dG8nO1xuaW1wb3J0IHsgUGx1Z2luT3B0aW9uc0J5VHlwZSB9IGZyb20gJ2NoYXJ0LmpzL2Rpc3QvdHlwZXMnO1xuaW1wb3J0IHsgQ2hhcnRzQ29uZmlndXJhdGlvbiB9IGZyb20gJy4uL21vZGVscyc7XG5pbXBvcnQgeyBQSUFfQ0hBUlRTX0NPTkZJR1VSQVRJT04gfSBmcm9tICcuLi9waWEtY2hhcnRzLWNvbmZpZ3VyYXRpb24udG9rZW4nO1xuaW1wb3J0IHsgQ29sb3JQYWxldHRlVXRpbGl0eSB9IGZyb20gJy4uL3V0aWxpdGllcy9jb2xvci1wYWxldHRlLnV0aWxpdHknO1xuXG5AQ29tcG9uZW50KHtcbiAgc2VsZWN0b3I6ICdwaWEtY2hhcnQnLFxuICB0ZW1wbGF0ZVVybDogJy4vY2hhcnQuY29tcG9uZW50Lmh0bWwnLFxuICBzdHlsZVVybHM6IFsnLi9jaGFydC5jb21wb25lbnQuY3NzJ10sXG4gIGNoYW5nZURldGVjdGlvbjogQ2hhbmdlRGV0ZWN0aW9uU3RyYXRlZ3kuT25QdXNoLFxufSlcbmV4cG9ydCBjbGFzcyBDaGFydENvbXBvbmVudCBpbXBsZW1lbnRzIE9uQ2hhbmdlcywgQWZ0ZXJWaWV3SW5pdCB7XG4gIEBJbnB1dCgpXG4gIHB1YmxpYyBjb25maWchOiBDaGFydENvbmZpZ3VyYXRpb248Q2hhcnRUeXBlPjtcbiAgcHVibGljIGNoYXJ0OiBDaGFydDxDaGFydFR5cGU+IHwgbnVsbCA9IG51bGw7XG5cbiAgQFZpZXdDaGlsZCgnY2FudmFzJywgeyByZWFkOiBFbGVtZW50UmVmIH0pXG4gIHByaXZhdGUgcmVhZG9ubHkgY2FudmFzOiBFbGVtZW50UmVmIHwgbnVsbCA9IG51bGw7XG5cbiAgcHVibGljIGNvbnN0cnVjdG9yKFxuICAgIEBJbmplY3QoUElBX0NIQVJUU19DT05GSUdVUkFUSU9OKVxuICAgIHB1YmxpYyBnbG9iYWxDb25maWc6IENoYXJ0c0NvbmZpZ3VyYXRpb25cbiAgKSB7fVxuXG4gIHB1YmxpYyBuZ09uQ2hhbmdlcyhjaGFuZ2VzOiBTaW1wbGVDaGFuZ2VzKTogdm9pZCB7XG4gICAgaWYgKHRoaXMuY2hhcnQgIT09IG51bGwpIHtcbiAgICAgIHRoaXMucHJlcGFyZUNoYXJ0Q29uZmlndXJhdGlvbigpO1xuICAgICAgdGhpcy5jaGFydC5kYXRhID0gdGhpcy5jb25maWcuZGF0YTtcbiAgICAgIHRoaXMuY2hhcnQudXBkYXRlKCk7XG4gICAgfVxuICB9XG5cbiAgcHVibGljIG5nQWZ0ZXJWaWV3SW5pdCgpOiB2b2lkIHtcbiAgICB0aGlzLnByZXBhcmVDaGFydENvbmZpZ3VyYXRpb24oKTtcblxuICAgIHRoaXMuY2hhcnQgPSBuZXcgQ2hhcnQodGhpcy5jYW52YXM/Lm5hdGl2ZUVsZW1lbnQsIHRoaXMuY29uZmlnKTtcbiAgfVxuXG4gIHByaXZhdGUgcHJlcGFyZUNoYXJ0Q29uZmlndXJhdGlvbigpOiB2b2lkIHtcbiAgICB0aGlzLmFwcGx5Q29sb3JzVG9EYXRhU2V0cygpO1xuICAgIHRoaXMuYXBwbHlQbHVnaW5Db25maWd1cmF0aW9ucygpO1xuICAgIHRoaXMuYXBwbHlSZXNwb25zaXZlQ29uZmlndXJhdGlvbigpO1xuICB9XG5cbiAgcHJpdmF0ZSBhcHBseUNvbG9yc1RvRGF0YVNldHMoKTogdm9pZCB7XG4gICAgaWYgKHRoaXMuY29uZmlnLmRhdGEuZGF0YXNldHMubGVuZ3RoID09PSAwKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgbGV0IHRyYW5zZm9ybWVyOiAoXG4gICAgICBkYXRhc2V0OiBDaGFydERhdGFzZXQ8Q2hhcnRUeXBlPixcbiAgICAgIGluZGV4OiBudW1iZXJcbiAgICApID0+IENoYXJ0RGF0YXNldDxDaGFydFR5cGU+O1xuXG4gICAgc3dpdGNoICh0aGlzLmNvbmZpZy50eXBlKSB7XG4gICAgICBjYXNlICdiYXInOlxuICAgICAgICB0cmFuc2Zvcm1lciA9IChkYXRhc2V0LCBpKSA9PiB7XG4gICAgICAgICAgZGF0YXNldC5iYWNrZ3JvdW5kQ29sb3IgPSBDb2xvclBhbGV0dGVVdGlsaXR5LmdldENvbG9yRm9ySXRlcmF0b3IoaSk7XG4gICAgICAgICAgcmV0dXJuIGRhdGFzZXQ7XG4gICAgICAgIH07XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAnbGluZSc6XG4gICAgICAgIHRyYW5zZm9ybWVyID0gKGRhdGFzZXQsIGkpID0+IHtcbiAgICAgICAgICBkYXRhc2V0LmJvcmRlckNvbG9yID0gQ29sb3JQYWxldHRlVXRpbGl0eS5nZXRDb2xvckZvckl0ZXJhdG9yKGkpO1xuICAgICAgICAgIGRhdGFzZXQuYmFja2dyb3VuZENvbG9yID0gZGF0YXNldC5ib3JkZXJDb2xvcjtcbiAgICAgICAgICByZXR1cm4gZGF0YXNldDtcbiAgICAgICAgfTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBkZWZhdWx0OlxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1Vuc3VwcG9ydGVkIGNoYXJ0IHR5cGU6ICcgKyB0aGlzLmNvbmZpZy50eXBlKTtcbiAgICB9XG5cbiAgICB0aGlzLmNvbmZpZy5kYXRhLmRhdGFzZXRzID0gdGhpcy5jb25maWcuZGF0YS5kYXRhc2V0cy5tYXAoXG4gICAgICAoZGF0YXNldCwgaW5kZXgpID0+XG4gICAgICAgIC8vIGRvbid0IG92ZXJyaWRlIGNvbG9yc1xuICAgICAgICBkYXRhc2V0LmJhY2tncm91bmRDb2xvciA/IGRhdGFzZXQgOiB0cmFuc2Zvcm1lcihkYXRhc2V0LCBpbmRleClcbiAgICApO1xuICB9XG5cbiAgcHJpdmF0ZSBhcHBseVBsdWdpbkNvbmZpZ3VyYXRpb25zKCkge1xuICAgIGlmICh0aGlzLmdsb2JhbENvbmZpZy5sZWdlbmQpIHtcbiAgICAgIHRoaXMuY29uZmlndXJlUGx1Z2luKCdsZWdlbmQnLCB0aGlzLmdsb2JhbENvbmZpZy5sZWdlbmQpO1xuICAgIH1cblxuICAgIGlmICh0aGlzLmdsb2JhbENvbmZpZy50b29sdGlwKSB7XG4gICAgICB0aGlzLmNvbmZpZ3VyZVBsdWdpbigndG9vbHRpcCcsIHRoaXMuZ2xvYmFsQ29uZmlnLnRvb2x0aXApO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgYXBwbHlSZXNwb25zaXZlQ29uZmlndXJhdGlvbigpOiB2b2lkIHtcbiAgICB0aGlzLmNvbmZpZyA9IHtcbiAgICAgIC4uLnRoaXMuY29uZmlnLFxuICAgICAgb3B0aW9uczoge1xuICAgICAgICAuLi50aGlzLmNvbmZpZy5vcHRpb25zLFxuICAgICAgICBtYWludGFpbkFzcGVjdFJhdGlvOiBmYWxzZSxcbiAgICAgIH0sXG4gICAgfTtcbiAgfVxuXG4gIHByaXZhdGUgY29uZmlndXJlUGx1Z2luKFxuICAgIGtleToga2V5b2YgUGx1Z2luT3B0aW9uc0J5VHlwZTxDaGFydFR5cGU+LFxuICAgIHBsdWdpbkNvbmZpZzogUGFydGlhbDxcbiAgICAgIFBsdWdpbk9wdGlvbnNCeVR5cGU8Q2hhcnRUeXBlPltrZXlvZiBQbHVnaW5PcHRpb25zQnlUeXBlPENoYXJ0VHlwZT5dXG4gICAgPlxuICApIHtcbiAgICB0aGlzLmNvbmZpZyA9IHtcbiAgICAgIC4uLnRoaXMuY29uZmlnLFxuICAgICAgb3B0aW9uczoge1xuICAgICAgICAuLi50aGlzLmNvbmZpZy5vcHRpb25zLFxuICAgICAgICBwbHVnaW5zOiB7XG4gICAgICAgICAgLi4uKHRoaXMuY29uZmlnLm9wdGlvbnM/LnBsdWdpbnMgPyB0aGlzLmNvbmZpZy5vcHRpb25zLnBsdWdpbnMgOiB7fSksXG4gICAgICAgICAgW2tleV06IHtcbiAgICAgICAgICAgIC4uLih0eXBlb2YgdGhpcy5jb25maWcub3B0aW9ucz8ucGx1Z2lucyA9PT0gJ29iamVjdCcgJiZcbiAgICAgICAgICAgIGtleSBpbiB0aGlzLmNvbmZpZy5vcHRpb25zLnBsdWdpbnNcbiAgICAgICAgICAgICAgPyB0aGlzLmNvbmZpZy5vcHRpb25zLnBsdWdpbnNba2V5XVxuICAgICAgICAgICAgICA6IHt9KSxcbiAgICAgICAgICAgIC4uLnBsdWdpbkNvbmZpZyxcbiAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgfSxcbiAgICB9O1xuICB9XG59XG4iLCI8IS0tXG4gIH4gU1BEWC1GaWxlQ29weXJpZ2h0VGV4dDogMjAyMyBIZWxtaG9sdHotWmVudHJ1bSBmw7xyIEluZmVrdGlvbnNmb3JzY2h1bmcgR21iSCAoSFpJKSA8UGlhUG9zdEBoZWxtaG9sdHotaHppLmRlPlxuICB+XG4gIH4gU1BEWC1MaWNlbnNlLUlkZW50aWZpZXI6IEFHUEwtMy4wLW9yLWxhdGVyXG4gIC0tPlxuXG48Y2FudmFzICNjYW52YXM+PC9jYW52YXM+XG4iXX0=