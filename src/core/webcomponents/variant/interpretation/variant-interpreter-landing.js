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
import {classMap} from "/web_modules/lit-html/directives/class-map.js";
import UtilsNew from "../../../utilsNew.js";
import "../../clinical/opencga-clinical-analysis-writer.js";
import "../../commons/filters/clinical-analysis-id-autocomplete.js";
import "../../commons/view/data-form.js";

class VariantInterpreterLanding extends LitElement {

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
            // clinicalAnalysisId: {
            //     type: String
            // },
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

        this.clinicalAnalysisEditorConfig = {
            display: {
                showTitle: false,
                buttons: {
                    show: true
                }
            }
        };

        // TODO Delete this code, just for the development purposes.
        // this.clinicalAnalysisId = "AN-12";
        // this.clinicalAnalysisIdObserver();
    }

    connectedCallback() {
        super.connectedCallback();
        this.activeTab = {};
        this._config = {...this.getDefaultConfig(), ...this.config};
        // this.requestUpdate();
    }

    firstUpdated(_changedProperties) {
        // this.requestUpdate();
    }

    updated(changedProperties) {
        if (changedProperties.has("opencgaSession")) {
            this.opencgaSessionObserver();
        }
        // if (changedProperties.has("clinicalAnalysisId")) {
        //     this.clinicalAnalysisIdObserver();
        // }
        if (changedProperties.has("clinicalAnalysis")) {
            //this.clinicalAnalysisObserver();
            //this.clinicalAnalysis;
        }
    }

    opencgaSessionObserver() {

        //debugger
        // Check logged user is the study owner
        let _studyOwner = this.opencgaSession.study.fqn.split("@")[0];
        if (this.opencgaSession.user.id === _studyOwner) {
            this.editMode = true;
        } else {
            let _editMode = false;
            for (let group of this.opencgaSession.study.groups) {
                if (group.id === "@admins") {
                    _editMode = group.userIds.includes(this.opencgaSession.user.id);
                    //break;
                }
            }
            if (!_editMode) {
                _editMode = this.opencgaSession.study?.acl?.includes("WRITE_CLINICAL_ANALYSIS");
            }
            this.editMode = _editMode;
        }

        this.onCloseClinicalAnalysis();

        this.getLastClinicalAnalysis();
    }

    // non-bootstrap tabs
    _changeTab(e) {
        e.preventDefault();

        const tabId = e.currentTarget.dataset.id;
        //the selectors are strictly defined to avoid conflics in tabs in children components
        $("#variant-interpreter-landing > .tablist > .content-pills", this).removeClass("active");
        $("#variant-interpreter-landing > .content-tab-wrapper > .content-tab", this).hide();
        $(`.${tabId}-tab`).addClass("active");
        $("#" + tabId, this).show();
        for (const tab in this.activeTab) this.activeTab[tab] = false;
        this.activeTab[tabId] = true;
        this.requestUpdate();
    }

    onCloseClinicalAnalysis() {
        // this.clinicalAnalysis = null;
        this.dispatchEvent(new CustomEvent("selectClinicalAnalysis", {
            detail: {
                id: null,
                clinicalAnalysis: null
            },
            bubbles: true,
            composed: true
        }));
    }

    onClinicalAnalysisUpdate(e) {
        // debugger
        // this.dispatchEvent(new CustomEvent("selectClinicalAnalysis", {
        //     detail: {
        //         id: e.detail.clinicalAnalysis?.id,
        //         clinicalAnalysis: e.detail.clinicalAnalysis
        //     },
        //     bubbles: true,
        //     composed: true
        // }));
    }


    onClinicalAnalysisIdChange(key, value) {
        this.clinicalAnalysisId = value;
        this.probandId = null;

    }

    onProbandIdChange(key, value) {
        //this.probandId = value;
        this.clinicalAnalysisId = value;
    }

    onClinicalAnalysisChange() {
        let _this = this;
        if (this.clinicalAnalysisId) {
            this.opencgaSession.opencgaClient.clinical().info(this.clinicalAnalysisId, {study: this.opencgaSession.study.fqn})
                .then(response => {
                    _this.clinicalAnalysis = response.responses[0].results[0];
                    _this.dispatchEvent(new CustomEvent("selectClinicalAnalysis", {
                        detail: {
                            id: _this.clinicalAnalysis ? _this.clinicalAnalysis.id : null,
                            clinicalAnalysis: _this.clinicalAnalysis
                        },
                        bubbles: true,
                        composed: true
                    }));
                })
                .catch(response => {
                    console.error("An error occurred fetching clinicalAnalysis: ", response);
                });
        } else if (this.probandId) {
            this.opencgaSession.opencgaClient.clinical().search({proband: this.probandId, study: this.opencgaSession.study.fqn})
                .then(response => {
                    _this.clinicalAnalysis = response.responses[0].results[0];
                    _this.dispatchEvent(new CustomEvent("selectClinicalAnalysis", {
                        detail: {
                            id: _this.clinicalAnalysis ? _this.clinicalAnalysis.id : null,
                            clinicalAnalysis: _this.clinicalAnalysis
                        },
                        bubbles: true,
                        composed: true
                    }));
                })
                .catch(response => {
                    console.error("An error occurred fetching clinicalAnalysis: ", response);
                });
        }
    }

    onClinicalAnalysisCreate(e) {
        // Fetch object from server since the server automatically adds some information
        let _this = this;
        this.opencgaSession.opencgaClient.clinical().info(e.detail.id, {study: this.opencgaSession.study.fqn})
            .then(response => {
                _this.clinicalAnalysis = response.responses[0].results[0];
                _this.dispatchEvent(new CustomEvent("selectClinicalAnalysis", {
                    detail: {
                        id: _this.clinicalAnalysis ? _this.clinicalAnalysis.id : null,
                        clinicalAnalysis: _this.clinicalAnalysis
                    },
                    bubbles: true,
                    composed: true
                }));
            })
            .catch(response => {
                console.error("An error occurred fetching clinicalAnalysis: ", response);
            });
    }

    getLastClinicalAnalysis() {
        // Fetch object from server since the server automatically adds some information
        //console.error("getLastClinicalAnalysis")
        this.opencgaSession.opencgaClient.clinical().search({study: this.opencgaSession.study.fqn, limit: 10})
            .then(response => {
                this.lastClinicalAnalysis = response.responses[0].results.map(value => value.id);
                this.lastClinicalAnalysis = [...this.lastClinicalAnalysis];
                //console.log("this.lastClinicalAnalysis", this.lastClinicalAnalysis)
                //debugger
                this.requestUpdate();
            })
            .catch(response => {
                console.error("An error occurred fetching clinicalAnalysis: ", response);
                this.lastClinicalAnalysis = [];
            });
    }

    onSearchFieldChange(e) {
        switch (e.detail.param) {
            case "id":
                this.clinicalAnalysisId = e.detail.value;
                this.probandId = null;
                break;
            case "proband.id":
                this.probandId = e.detail.value;
                this.clinicalAnalysisId = null;
                break;
        }
    }

    getSearchConfig() {
        return {
            id: "clinical-analysis",
            title: "",
            icon: "",
            type: "form",
            description: "Sample Variant Stats description",
            buttons: {
                show: true,
                clearText: "Clear",
                submitText: "Open"
            },
            display: {
                showTitle: true,
                infoIcon: "",
                labelAlign: "left",
                defaultLayout: "vertical",
                classes: "col-md-4 col-md-offset-4"
            },
            sections: [
                {
                    title: "Open Case",
                    display: {},
                    elements: [
                        {
                            name: "Clinical Analysis ID",
                            field: "id",
                            type: "custom",
                            display: {
                                render: () => {
                                    const config = {
                                        addButton: false,
                                        multiple: false,
                                        dataSource: (query, process) => {
                                            const filters = {
                                                study: this.opencgaSession.study.fqn,
                                                limit: 20,
                                                count: false,
                                                id: "~^" + query.toUpperCase()
                                            };
                                            this.opencgaSession.opencgaClient.clinical().search(filters).then(restResponse => {
                                                const results = restResponse.getResults();
                                                process(results.map(item => ({name: item.id, Type: item?.type, "Proband Id": item?.proband?.id})));
                                            });
                                        }
                                    };
                                    return html`<clinical-analysis-id-autocomplete .config=${config} .opencgaSession="${this.opencgaSession}" @filterChange="${e => this.onClinicalAnalysisIdChange("clinicalAnalysisId", e.detail.value)}"></clinical-analysis-id-autocomplete>`;
                                },
                                placeholder: "eg. AN-3",
                                errorMessage: ""
                            }
                        },
                        {
                            name: "Individual ID",
                            field: "proband.id",
                            type: "custom",
                            display: {
                                render: () => {
                                    const config = {
                                        addButton: false,
                                        multiple: false,
                                        dataSource: (query, process) => {
                                            const filters = {
                                                study: this.opencgaSession.study.fqn,
                                                limit: 20,
                                                count: false,
                                                proband: "~^" + query.toUpperCase()
                                            };
                                            this.opencgaSession.opencgaClient.clinical().search(filters).then(restResponse => {
                                                const results = restResponse.getResults();
                                                process(results.map(item => ({name: item.id, Proband: item?.proband?.id})));
                                            });
                                        }
                                    };
                                    return html`<clinical-analysis-id-autocomplete .config=${config} .opencgaSession="${this.opencgaSession}" @filterChange="${e => this.onProbandIdChange("individualId", e.detail.value)}"></clinical-analysis-id-autocomplete>`;
                                }
                            }
                        },
                        {
                            name: "Recent Analysis created",
                            field: "id",
                            type: "select",
                            //defaultValue: this.lastClinicalAnalysis ? this.lastClinicalAnalysis[0] : null,
                            allowedValues: data => {
                                return this.lastClinicalAnalysis;
                            },
                            display: {}
                        }
                    ]
                }
            ]
        };
    }

    getDefaultConfig() {
        return {
            clinicalAnalysisSelector: true
        };
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

        return html`
            <style>
                #variant-interpreter-landing .nav-tabs.nav-center {
                    /*margin-bottom: 20px;*/
                }
            </style>
            <div id="variant-interpreter-landing">
                ${this._config.clinicalAnalysisSelector ? html`
                    <div>
                    <ul class="nav nav-tabs nav-center tablist" role="tablist" aria-label="toolbar">
                        <li role="presentation" class="content-pills active ${classMap({active: this.activeTab["landing-search"] || UtilsNew.isEmpty(this.activeTab)})}"">
                            <a href="javascript: void 0" role="tab" data-id="landing-search" @click="${this._changeTab}" class="tab-title">Select Case</a>
                        </li>
                        <li role="presentation" class="content-pills ${classMap({active: this.activeTab["landing-create"]})}"">
                            <a href="javascript: void 0" role="tab" data-id="landing-create" @click="${e => this.editMode && this._changeTab(e)}" class="tab-title ${classMap({disabled: !this.editMode})}">Create Case</a>
                        </li>
                        <!--<li role="presentation" class="content-pills help-pill ${classMap({active: this.activeTab["landing-help"]})}">
                            <a href="javascript: void 0" role="tab" data-id="landing-help" @click="${this._changeTab}" class="tab-title"><i class="fas fa-question-circle"></i> Help</a>
                        </li>-->
                    </ul>
                </div>
                ` : null}
                
                
                <div class="content-tab-wrapper">
                    <div id="landing-search" role="tabpanel" class="tab-pane active content-tab">
                        ${this.clinicalAnalysis
                            ? html`
                                <div class="row">
                                    <div class="col-md-10 col-md-offset-1">
                                    <!--<div style="float: left">
                                        <h2>Case ${this.clinicalAnalysis.id}</h2>
                                    </div> -->
                                    
                                    ${false && this._config.clinicalAnalysisSelector ? html`
                                        <div class="row pad5">
                                            <div class="pull-right">
                                                <button class="btn btn-primary ripple" @click="${this.onCloseClinicalAnalysis}">
                                                    <i class="fas fa-times icon-padding"></i>Close
                                                </button>
                                            </div>
                                        </div>  
                                    ` : null}
                                    <opencga-clinical-analysis-view .opencgaSession="${this.opencgaSession}"
                                                                    .clinicalAnalysis="${this.clinicalAnalysis}">
                                    </opencga-clinical-analysis-view>
                                    </div>
                                </div>`
                            : this._config.clinicalAnalysisSelector
                                ? html`
                                    <data-form  .data="${{}}" 
                                                .config="${this.getSearchConfig()}" 
                                                @fieldChange="${this.onSearchFieldChange}"
                                                @clear="${this.onClinicalAnalysisChange}"
                                                @submit="${this.onClinicalAnalysisChange}">
                                    </data-form>`
                                : null
                        }
                    </div>
                    
                    ${this._config.clinicalAnalysisSelector ? html`
                        <div id="landing-create" role="tabpanel" class="tab-pane content-tab">
                        <div class="col-md-8 col-md-offset-2">
                            <div class="row pad5">
                                <!--<div style="float: left">
                                    <h2>Create Case</h2>
                                </div>-->
                                <div class="pull-right">
                                    <button class="btn btn-primary ripple" @click="${this.onCloseClinicalAnalysis}">
                                        <i class="fas fa-eraser icon-padding"></i>Clear
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div class="row">
                            <div class="col-md-8 col-md-offset-2">
                                <opencga-clinical-analysis-writer   .opencgaSession="${this.opencgaSession}"
                                                                    .config="${this.clinicalAnalysisEditorConfig}"
                                                                    @clinicalanalysischange="${e => this.onClinicalAnalysisUpdate(e)}"
                                                                    @clinicalAnalysisCreate="${e => this.onClinicalAnalysisCreate(e)}">
                                </opencga-clinical-analysis-writer> 
                           </div>
                        </div>
                    </div>
                    ` : null}
                    
                    
                    <div id="landing-help" role="tabpanel" class="tab-pane content-tab">
                        <div class="container">
                            
                        </div>
                        
                    </div>
                </div>
            </div>
        `;
    }

}

customElements.define("variant-interpreter-landing", VariantInterpreterLanding);
