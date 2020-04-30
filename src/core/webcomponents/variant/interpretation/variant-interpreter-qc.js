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


class VariantInterpreterQc extends LitElement {

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
            query: {
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

        // this._config = {...this.getDefaultConfig(), ...this.config};
        this.requestUpdate();
    }

    firstUpdated(_changedProperties) {
        this.requestUpdate();
    }

    updated(changedProperties) {
        // if (changedProperties.has("opencgaSession")) {
        //     this.opencgaSessionObserver();
        // }
        // if (changedProperties.has("clinicalAnalysisId")) {
        //     this.clinicalAnalysisIdObserver();
        // }
        // if (changedProperties.has("clinicalAnalysis")) {
        //     this.clinicalAnalysisObserver();
        // }
        // if (changedProperties.has("query")) {
        //     this.queryObserver();
        // }
    }

    onCloseClinicalAnalysis() {
        this.clinicalAnalysis = null;
        this.dispatchEvent(new CustomEvent("selectclinicalnalysis", {
            detail: {
                id: null,
                clinicalAnalysis: null,
            }
        }));
    }

    onClinicalAnalysisChange() {
        if (this.clinicalAnalysisId) {
            let _this = this;
            this.opencgaSession.opencgaClient.clinical().info(this.clinicalAnalysisId, {study: this.opencgaSession.study.fqn})
                .then(response => {
                    _this.clinicalAnalysis = response.responses[0].results[0];
                    _this.dispatchEvent(new CustomEvent("selectclinicalnalysis", {
                        detail: {
                            id: _this.clinicalAnalysis.id,
                            clinicalAnalysis: _this.clinicalAnalysis,
                        }
                    }));
                })
                .catch(response => {
                    console.error("An error occurred fetching clinicalAnalysis: ", response);
                });
        }
    }

    onFilterChange(name, value) {
        this.clinicalAnalysisId = value;
    }

    onIndividualChange(name, individualId) {
        let _this = this;
        this.opencgaSession.opencgaClient.individuals().info(individualId, {study: this.opencgaSession.study.fqn})
            .then(response => {
                // Create a CLinical Analysis object
                let _clinicalAnalysis = {
                    id: "",
                    proband: response.responses[0].results[0],
                    type: "CANCER"
                };
                _this.clinicalAnalysis = _clinicalAnalysis;

                // _this.requestUpdate();
                // _this.onClinicalAnalysisChange();
            })
            .catch(response => {
                console.error("An error occurred fetching clinicalAnalysis: ", response);
            });
    }

    render() {
        // Check Project exists
        if (!this.opencgaSession.project) {
            return html`
                <div class="guard-page">
                    <i class="fas fa-lock fa-5x"></i>
                    <h3>No public projects available to browse. Please login to continue</h3>
                </div>
            `;
        }

        if (this.clinicalAnalysis) {
            return html`
                    <div class="row">
                        <div class="col-md-10 col-md-offset-1">
                            <div style="float: right">
                                <button class="btn btn-default" @click="${this.onCloseClinicalAnalysis}">Close</button>
                            </div>
                        </div>
                        
                        <div class="col-md-10 col-md-offset-1">
                            <h2>Case ${this.clinicalAnalysis.id}</h2>
                            <opencga-clinical-analysis-view .opencgaSession="${this.opencgaSession}"
                                                            .clinicalAnalysis="${this.clinicalAnalysis}"
                                                            style="font-size: 12px"
                                                            .config="${this._config}">
                            </opencga-clinical-analysis-view>
                        </div>
                    </div>`;
        }

        return html`
                <div class="row">
                    <div class="col-md-4 col-md-offset-2">
                        <div>
                            <h2>Quality Control</h2>
                            
                            <h4>Clinical Analysis ID</h4>
                            <div class="text-filter-wrapper">
                                <!--<input type="text" name="clinicalAnalysisText" id="clinicalAnalysisIdText" value="AN-3">-->
                                <select-field-filter-autocomplete-simple .fn="${true}" resource="clinical-analysis" .value="${"AN-3"}" .opencgaSession="${this.opencgaSession}" @filterChange="${e => this.onFilterChange("clinicalAnalysisId", e.detail.value)}"></select-field-filter-autocomplete-simple>
                            </div>
                            
                            <h4>Proband ID</h4>
                            <div class="text-filter-wrapper">
                                <select-field-filter-autocomplete-simple .fn="${true}" resource="individuals" .opencgaSession="${this.opencgaSession}" @filterChange="${e => this.onIndividualChange("individualId", e.detail.value)}"></select-field-filter-autocomplete-simple>
                            </div>

                            <div>                            
                                <button class="btn btn-default ripple" @click="${this.onClinicalAnalysisChange}">Clear</button>
                                <button class="btn btn-default ripple" @click="${this.onClinicalAnalysisChange}">OK</button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
    }

}

customElements.define("variant-interpreter-qc", VariantInterpreterQc);