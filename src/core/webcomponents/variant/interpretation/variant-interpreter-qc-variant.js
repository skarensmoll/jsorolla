/*
 * Copyright 2015-2016 OpenCB
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {LitElement, html} from "/web_modules/lit-element.js";
import UtilsNew from "../../../utilsNew.js";
import "../../simple-plot.js";

class VariantInterpreterQcVariant extends LitElement {

    constructor() {
        super();

        // Set status and init private properties
        this._init();
    }

    createRenderRoot() {
        return this;
    }

    static get properties() {
        return {
            opencgaSession: {
                type: Object
            },
            clinicalAnalysisId: {
                type: String
            },
            clinicalAnalysis: {
                type: Object
            },
            config: {
                type: Object
            }
        };
    }

    _init() {
        this._prefix = "vcis-" + UtilsNew.randomString(6);
    }

    connectedCallback() {
        super.connectedCallback();

        this.variantTypes = ["SNV", "INDEL", "CNV", "INSERTION", "DELETION", "MNV"]
        this.sampleVariantStats = {
            id: "001",
            variantCount: 5,
            chromosomeCount: [1,3,5,7,11],
            typeCount: [1,3,5,7,11],
            genotypeCount: [3,5,7],
            filterCount: [],
            tiTvRatio: .8
        }
    }

    firstUpdated(_changedProperties) {
        console.log(this.variantTypes.map( (type, i) => ({name: type, data: this.sampleVariantStats.typeCount[i]})))
        /*this.barChart({
            title: "Variant types",
            categories: this.variantTypes,
            data: this.sampleVariantStats.typeCount
        }, "typePlot")*/
    }

    updated(changedProperties) {
        // if (changedProperties.has("opencgaSession")) {
        //     this.opencgaSessionObserver();
        // }
        if (changedProperties.has("clinicalAnalysisId")) {
            this.clinicalAnalysisIdObserver();
        }
        // if (changedProperties.has("clinicalAnalysis")) {
        //     this.clinicalAnalysisObserver();
        // }
    }

    clinicalAnalysisIdObserver() {
        if (this.clinicalAnalysisId) {
            let _this = this;
            this.opencgaSession.opencgaClient.clinical().info(this.clinicalAnalysisId, {study: this.opencgaSession.study.fqn})
                .then(response => {
                    _this.clinicalAnalysis = response.responses[0].results[0];
                })
                .catch(response => {
                    console.error("An error occurred fetching clinicalAnalysis: ", response);
                });
        }
    }

    barChart(param, selector) {
        Highcharts.chart(selector, {
            chart: {
                type: "column"
            },
            title: {
                text: param.title
            },
            xAxis: {
                categories: param.categories, //['Africa', 'America', 'Asia', 'Europe', 'Oceania'],
                title: {
                    text: null
                }
            },
            yAxis: {
                min: 0,
                title: {
                    text: "Population (millions)",
                    align: "high"
                },
                labels: {
                    overflow: "justify"
                }
            },
            tooltip: {
                valueSuffix: " millions"
            },
            plotOptions: {
                bar: {
                    dataLabels: {
                        enabled: true
                    }
                }
            },
            legend: {
                layout: "vertical",
                align: "right",
                verticalAlign: "top",
                x: -40,
                y: 80,
                floating: true,
                borderWidth: 1,
                shadow: true
            },
            credits: {
                enabled: false
            },
            series: [{
                type: 'column',
                colorByPoint: true,
                data: param.data,
                showInLegend: false

            }]
            /*
            series: [{
                name: 'Year 1800',
                data: [107, 31, 635, 203, 2]
            }, {
                name: 'Year 1900',
                data: [133, 156, 947, 408, 6]
            }, {
                name: 'Year 2000',
                data: [814, 841, 3714, 727, 31]
            }, {
                name: 'Year 2016',
                data: [1216, 1001, 4436, 738, 40]
            }]*/
        });
    }

    render() {
        // Check Project exists
        if (!this.opencgaSession.project) {
            return html`
                    <div>
                        <h3><i class="fas fa-lock"></i> No public projects available to browse. Please login to continue</h3>
                    </div>`;
        }

        // Check Clinical Analysis exist
        if (!this.clinicalAnalysis) {
            return html`
                    <div>
                        <h3><i class="fas fa-lock"></i> No Case open</h3>
                    </div>`;
        }

        // Variant stats are different for FAMILY and CANCER analysis, this does not happens with Alignment
        if (this.clinicalAnalysis.type.toUpperCase() === "FAMILY") {
            return html`
                <div>
                    <h3>RD Variant Stats</h3>
                    <!-- <span>We must use the new component opencga-sample-variant-stats for 
                    <a href="https://github.com/opencb/biodata/blob/develop/biodata-models/src/main/avro/variantMetadata.avdl#L122" target="_blank">https://github.com/opencb/biodata/blob/develop/biodata-models/src/main/avro/variantMetadata.avdl#L122</a></span> -->
                    <div class="row">
                        <div class="col-md-12">
                            <div class="form-horizontal">
                                <div class="form-group">
                                    <label class="col-md-3 label-title">Id</label>
                                    <span class="col-md-9">001</span>
                                </div>
                                <div class="form-group">
                                    <label class="col-md-3 label-title">Variant Count</label>
                                    <span class="col-md-9">001</span>
                                </div>
                                <div class="form-group">
                                    <label class="col-md-3 label-title">Id</label>
                                    <span class="col-md-9">001</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="row">
                        <div class="col-md-12">
                            <div id="typePlot"></div>  
                            <simple-plot .active="${true}" type="column" title="Variant types" .categories="${this.variantTypes}" .data="${this.sampleVariantStats.typeCount}"></simple-plot>  
                        </div>
                        <div class="col-md-12">
                            <simple-plot .active="${true}" type="column" title="Variant types" .categories="${this.variantTypes}" .data="${[3,5,7,8,2]}"></simple-plot>  
                        </div>
                        <div class="col-md-12">
                            <simple-plot .active="${true}" type="column" title="Variant types" .categories="${this.variantTypes}" .data="${[13,35,27,18,92]}"></simple-plot>  
                        </div>
                    </div>
                    
                    
                <!--<div class="col-md-12">
                    <h3 class="section-title">Annotations</h3>
    
                </div> -->
                </div>
            
            `;
        }

        if (this.clinicalAnalysis.type.toUpperCase() === "CANCER") {
            return html`
                <div>
                    <h3>Cancer Variant Stats</h3>
                    
                </div>
            `;
        }

    }

}

customElements.define("variant-interpreter-qc-variant", VariantInterpreterQcVariant);