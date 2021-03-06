/**
 * Copyright 2015-2019 OpenCB
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

import {html, LitElement} from "/web_modules/lit-element.js";
import UtilsNew from "../../utilsNew.js";
import "../loading-spinner.js";
import GridCommons from "./grid-commons.js";

export default class OpencgaVariantSamples extends LitElement {

    constructor() {
        super();

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
            variantId: {
                type: String
            },
            active: {
                type: Boolean
            }
        };
    }

    _init() {
        this._prefix = "ovcs" + UtilsNew.randomString(6);

        this.active = false;
        this.gridId = this._prefix + "SampleTable";
        this.config = this.getDefaultConfig();
    }

    updated(changedProperties) {
        if ((changedProperties.has("variantId") || changedProperties.has("active")) && this.active) {
            this.renderTable();
        }
    }

    firstUpdated(_changedProperties) {
        this.table = this.querySelector("#" + this.gridId);
        this.gridCommons = new GridCommons(this.gridId, this, this._config);
    }

    genoypeFormatter(value, row, index) {
        if (value && value.data && value.data.length > 0) {
            let gt = value.data[0];
            let color = gt === "0/1" || gt === "0|1" || gt === "1|0" ? "darkorange" : "red";
            return `<span style="color: ${color}">${value.data[0]}</span>`;
        } else {
            return "-";
        }
    }

    variantFormatter(value, row, index) {
        if (value && value.file && value.dataKeys && value.data && value.dataKeys.length === value.data.length) {
            let fileInfo = `Filter: ${value.file.data["FILTER"]}; Qual: ${value.file.data["QUAL"]}`;
            let sampleFormat = [];
            for (let i = 0; i < value.dataKeys.length; i++) {
                sampleFormat.push(`${value.dataKeys[i]}=${value.data[i]}`);
            }
            return fileInfo + "<br>" + sampleFormat.join("; ");
        } else {
            return "-";
        }
    }

    individualFormatter(value, row, index) {
        if (value) {
            return value;
        } else {
            return "-";
        }
    }

    sexFormatter(value, row, index) {
        //debugger
        if (value) {
            return `${value.sex} (${value.karyotypicSex})`;
        } else {
            return "-";
        }
    }

    phenotypesFormatter(value, row) {
        if (value && value.length) {
            const tooltip = value.map( phenotype => {
                return `
                    <div>
                        ${phenotype.source && phenotype.source.toUpperCase() === "HPO" ? `
                            <span><a target="_blank" href="https://hpo.jax.org/app/browse/term/${phenotype.id}">${phenotype.id} </a>(${phenotype.status})</span>
                        ` : `<span>${phenotype.id} (${phenotype.status})</span>`}
                    </div>`
            }).join("")
            return `<a tooltip-title="Phenotypes" tooltip-text='${tooltip}'> ${value.length} term${value.length > 1 ? "s": ""} found </a>`;
        } else {
            return "-";
        }
    }

    disorderFormatter(value, row, index) {
        if (value && value.length) {
            return value.map( disorder => `<p>${disorder.id}</p>`).join("");
        } else {
            return "-";
        }
    }

    renderTable() {
        if (!this.opencgaSession) {
            return;
        }

        this.from = 1;
        this.to = this.config.pageSize;

        this.table = $("#" + this.gridId);
        this.table.bootstrapTable("destroy");
        this.table.bootstrapTable({
            pagination: true,
            sidePagination: "server",
            columns: this.getColumns(),
            formatLoadingMessage: () => "<div><loading-spinner></loading-spinner></div>",
            ajax: params => {
                let tableOptions = this.table.bootstrapTable("getOptions");
                let limit = tableOptions.pageSize || 10;
                let skip = tableOptions.pageNumber ? tableOptions.pageNumber * limit - limit : 0;
                let query = {
                    variant: this.variantId,
                    study: this.opencgaSession.study.fqn,
                    genotype: "0/1,1/1,0/2,1/2,2/2",
                    skip: skip,
                    limit: limit
                };

                let _this = this;
                this.opencgaSession.opencgaClient.variants().querySample(query)
                    .then(function(response) {
                        let result = response.responses[0].results[0];

                        // Get the total number of samples
                        // TODO count only the genotypes filtered
                        // _this.numSamples = result.studies[0].samples.length;
                        _this.numSamples = 0;
                        let stats = result.studies[0].stats;
                        for (let stat of stats) {
                            if (stat.cohortId === "ALL") {
                                for (let gt of Object.keys(stat.genotypeCount)) {
                                    if (gt !== "0/0" && gt !== "./.") {
                                        _this.numSamples += stat.genotypeCount[gt];
                                    }
                                }
                                // _this.numSamples = stat.genotypeCount["0/1"] + stat.genotypeCount["1/1"]
                                // _this.numSamples = stat.sampleCount - stat.genotypeCount["0/0"]
                                break;
                            }
                        }

                        // Prepare sample variant data for next query
                        let variantSamples = result.studies[0].samples;
                        if (variantSamples && variantSamples.length > 0) {
                            let variantSampleInfo = {};
                            let sampleIds = [];
                            for (let variantSample of variantSamples) {
                                sampleIds.push(variantSample.sampleId);
                                variantSampleInfo[variantSample.sampleId] = {
                                    id: variantSample.sampleId,
                                    file: result.studies[0].files[variantSample.fileIndex],
                                    dataKeys: result.studies[0].sampleDataKeys,
                                    data: variantSample.data
                                };
                            }

                            _this.opencgaSession.opencgaClient.samples().info(sampleIds.join(","),
                                {
                                    study: _this.opencgaSession.study.fqn,
                                    includeIndividual: true
                                })
                                .then(function(resp) {
                                    let samples = resp.responses[0].results;
                                    for (let sample of samples) {
                                        sample.attributes.OPENCGA_VARIANT = variantSampleInfo[sample.id];
                                    }
                                    params.success(samples);
                                })
                                .catch(e => {
                                    console.error(e);
                                    params.error(e);
                                });
                        } else {
                            params.error("No samples found");
                        }
                    });
            },
            responseHandler: response => {
                let tableOptions = $(this.table).bootstrapTable("getOptions");
                this.from = tableOptions.pageNumber * tableOptions.pageSize - tableOptions.pageSize + 1;
                this.to = Math.min(tableOptions.pageNumber * tableOptions.pageSize, this.numSamples);
                this.numTotalResultsText = this.numSamples;
                this.requestUpdate();
                return {
                    total: this.numSamples,
                    rows: response
                };
            },
            onLoadSuccess: data => {
                this.gridCommons.onLoadSuccess(data, 2);
            },
            onLoadError: (e, restResponse) => this.gridCommons.onLoadError(e, restResponse),
        });
    }

    getColumns() {
        return [
            [
                {
                    title: "Sample ID",
                    field: "id",
                    rowspan: 2,
                    colspan: 1,
                    // formatter: this.variantFormatter,
                    halign: "center"
                },
                {
                    title: "Genotype",
                    field: "attributes.OPENCGA_VARIANT",
                    rowspan: 2,
                    colspan: 1,
                    formatter: this.genoypeFormatter,
                    halign: "center"
                },
                {
                    title: "Variant Data",
                    field: "attributes.OPENCGA_VARIANT",
                    rowspan: 2,
                    colspan: 1,
                    formatter: this.variantFormatter,
                    halign: "center"
                },
                {
                    title: "Individual",
                    rowspan: 1,
                    colspan: 4,
                    formatter: this.variantFormatter,
                    halign: "center"
                }
            ],
            [
                {
                    title: "ID",
                    field: "individualId",
                    colspan: 1,
                    rowspan: 1,
                    formatter: this.individualFormatter,
                    halign: "center"
                },
                {
                    title: "Sex",
                    field: "attributes.OPENCGA_INDIVIDUAL",
                    colspan: 1,
                    rowspan: 1,
                    formatter: this.sexFormatter,
                    halign: "center"
                },
                {
                    title: "Phenotypes",
                    field: "attributes.OPENCGA_INDIVIDUAL.phenotypes",
                    colspan: 1,
                    rowspan: 1,
                    formatter: this.phenotypesFormatter,
                    halign: "center"
                },
                {
                    title: "Disorders",
                    field: "attributes.OPENCGA_INDIVIDUAL.disorders",
                    colspan: 1,
                    rowspan: 1,
                    formatter: this.disorderFormatter,
                    halign: "center"
                }
            ]
        ];
    }

    async onDownload(e) {
        try {
            let samples;
            let query = {
                variant: this.variantId,
                study: this.opencgaSession.study.fqn,
                genotype: "0/1,1/1,0/2,1/2,2/2",
                limit: 1000
            };
            let response = await this.opencgaSession.opencgaClient.variants().querySample(query);
            let result = response.getResult(0);
            // Prepare sample variant data for next query
            let variantSamples = result.studies[0].samples;
            if (variantSamples && variantSamples.length > 0) {
                let variantSampleInfo = {};
                let sampleIds = [];
                for (let variantSample of variantSamples) {
                    sampleIds.push(variantSample.sampleId);
                    variantSampleInfo[variantSample.sampleId] = {
                        id: variantSample.sampleId,
                        file: result.studies[0].files[variantSample.fileIndex],
                        dataKeys: result.studies[0].sampleDataKeys,
                        data: variantSample.data
                    };
                }
                let sampleData = await this.opencgaSession.opencgaClient.samples().info(sampleIds.join(","),
                    {
                        study: this.opencgaSession.study.fqn,
                        includeIndividual: true
                    });
                samples = sampleData.responses[0].results;
                for (let sample of samples) {
                    sample.attributes.OPENCGA_VARIANT = variantSampleInfo[sample.id];
                }
            } else {
                console.error("No samples found");
            }

            const header = ["Sample ID", "Genotype", "Variant Data", "Individual ID", "Individual Sex", "Phenotypes", "Disorders"];
            const rows = samples.map( sample => {
                return  [
                    sample.id,
                    sample?.attributes?.OPENCGA_VARIANT?.data[0] ?? "-",
                    this.variantFormatter(sample?.attributes?.OPENCGA_VARIANT),
                    sample.individualId,
                    this.sexFormatter(sample?.attributes?.OPENCGA_INDIVIDUAL),
                    sample?.attributes?.OPENCGA_INDIVIDUAL?.phenotypes?.map( p => p.id) ?? "-",
                    sample?.attributes?.OPENCGA_INDIVIDUAL?.disorders?.map( d => d.id) ?? "-"
                ].join("\t");

            })
            let dataString, mimeType, extension;
            if (e.detail.option.toLowerCase() === "tab") {
                dataString = [
                    header.join("\t"),
                    rows.join("\n")];
                // console.log(dataString);
                mimeType = "text/plain";
                extension = ".txt";
            } else {
                dataString = [JSON.stringify(samples, null, "\t")];
                mimeType = "application/json";
                extension = ".json";
            }

            // Build file and anchor link
            const data = new Blob([dataString.join("\n")], {type: mimeType});
            const file = window.URL.createObjectURL(data);
            const a = document.createElement("a");
            a.href = file;
            a.download = this.opencgaSession.study.alias + extension;
            document.body.appendChild(a);
            a.click();
            setTimeout(function() {
                document.body.removeChild(a);
            }, 0);



        } catch (e) {
            console.error(e);
        }

    }

    getDefaultConfig() {
        return {
            pagination: true,
            pageSize: 10,
            pageList: [10, 25, 50],
            showExport: false
        };
    }

    render() {
        return html`
            <div style="padding: 20px">
                <opencb-grid-toolbar .from="${this.from}"
                                     .to="${this.to}"
                                     .numTotalResultsText="${this.numTotalResultsText}"
                                     .config="${this.toolbarConfig}"
                                     @columnChange="${this.onColumnChange}"
                                     @download="${this.onDownload}"
                                     @sharelink="${this.onShare}">
                </opencb-grid-toolbar>
                <div>
                    <table id="${this._prefix}SampleTable"></table>
                </div>
            </div>
        `;
    }
}

customElements.define("opencga-variant-samples", OpencgaVariantSamples);
