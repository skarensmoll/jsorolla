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

import {LitElement, html} from "/web_modules/lit-element.js";
import "./variant-beacon-network.js";


export default class VariantBeacon extends LitElement {

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
            config: {
                type: Object
            }
        };
    }

    _init() {
        this.checkProjects = false;
        this._config = this.getDefaultConfig();
    }

    updated(changedProperties) {
        if (changedProperties.has("opencgaSession") || changedProperties.has("config")) {
            this.propertyObserver();
            this.requestUpdate();
        }
    }

    propertyObserver() {
        this._config = Object.assign(this.getDefaultConfig(), this.config);
        if (UtilsNew.isNotUndefinedOrNull(this.opencgaSession) && UtilsNew.isNotUndefinedOrNull(this.opencgaSession.project)) {
            this.checkProjects = true;
        } else {
            console.log("opencgaesession null")
            this.checkProjects = false;
        }
    }

    clearFields(e) {
        this.querySelector("#datasetInput").value = "";
        this.querySelector("#refNameInput").value = "";
        this.querySelector("#startInput").value = "";
        this.querySelector("#alleleInput").value = "";
//                this.querySelector("#" + textType.checked = false;
//                this.querySelector("#" + jsonType.checked = false;
        this.result = "";
        this.clear = Utils.randomString(4); // Clear beacon network response
        this.variant = ""; // reset variant to empty
    }

    loadExample() {
        this.querySelector("#datasetInput").value = this.opencgaSession.project.studies[0].alias;
        this.querySelector("#refNameInput").value = "21";
        this.querySelector("#startInput").value = "46047686";
        this.querySelector("#alleleInput").value = "T";
        this.updateVariant();
    }

    execute(e) {
        this.clear = Utils.randomString(4); // Clear beacon network response
        let queryParams = {
            chrom: this.querySelector("#refNameInput").value,
            pos: Number(this.querySelector("#startInput").value) - 1,
            allele: this.querySelector("#alleleInput").value,
            beacon: this.opencgaSession.project.alias + ":" + this.querySelector("#datasetInput").value
        };

        if (this.opencgaSession.opencgaClient instanceof OpenCGAClient) {
            let _this = this;
            this.opencgaSession.opencgaClient.ga4gh().beacon(queryParams, {})
                .then(function(response) {
                    let exists = response[0].response.toString();
                    _this.result = exists.charAt(0).toUpperCase() + exists.slice(1);
                });
        }
    }

    updateVariant(e) {
        this.variant = this.querySelector("#refNameInput").value + ":" + this.querySelector("#startInput").value + "::" + this.querySelector("#alleleInput").value;
    }

    checkResult(result) {
        return UtilsNew.isNotEmpty(result);
    }

    getDefaultConfig() {
        return {
            hosts: [
                "brca-exchange", "cell_lines", "cosmic", "wtsi", "wgs", "ncbi", "ebi", "ega", "broad", "gigascience",
                "ucsc", "lovd", "hgmd", "icgc", "sahgp"
            ]
        };
    }

    render() {
        return html`
            <style include="jso-styles"></style>
    
            ${this.checkProjects ? html`
                <div class="panel" style="margin-bottom: 15px">
                    <h3 style="margin: 10px 10px 10px 30px">
                        <i class="fa fa-share-alt" aria-hidden="true"></i>&nbsp;GA4GH Beacon
                    </h3>
                </div>
    
                <div class="col-md-10 col-md-offset-1">
                    <h3 style="margin: 10px 5px 15px 25px">Input Variant</h3>
                    <div style="width: 60%; margin: 0px 0px 0px 100px">
                    <span>
                        <label>Example: </label>
                        <a @click="${this.loadExample}">Click to load example</a>
                    </span>
                        <br>
                        <br>
                        <div class="form-group row">
                            <label for="datasetInput" class="col-xs-2 col-form-label">Dataset</label>
                            <div class="col-xs-6">
                                <select class="form-control" name="dataset" id="datasetInput">
                                    ${this.opencgaSession && this.opencgaSession.project.studies ? this.opencgaSession.project.studies.map(item => html`
                                        <option value="${item.alias}">${item.name}</option>
                                    `) : null}
                                </select>
                            </div>
                        </div>
                        <div class="form-group row">
                            <label for="refNameInput" class="col-xs-2 col-form-label">Reference Name</label>
                            <div class="col-xs-3">
                                <input class="form-control" type="text" value="" id="refNameInput" @input="${this.updateVariant}">
                            </div>
                        </div>
                        <div class="form-group row">
                            <label for="startInput" class="col-xs-2 col-form-label">Start</label>
                            <div class="col-xs-3">
                                <input class="form-control" type="text" value="" id="startInput" @input="${this.updateVariant}">
                            </div>
                        </div>
                        <div class="form-group row">
                            <label for="alleleInput" class="col-xs-2 col-form-label">Allele</label>
                            <div class="col-xs-3">
                                <input class="form-control" type="text" value="" id="alleleInput" @input="${this.updateVariant}">
                            </div>
                        </div>
                        <!--<div class="form-group row">-->
                        <!--<label class="col-xs-2 col-form-label">Format Type</label>-->
                        <!--<div class="col-xs-3">-->
                        <!--<input class="form-check-input" type="checkbox" name="formatType" id="textType" value="text" checked> Text-->
                        <!--<input class="form-check-input" type="checkbox" name="formatType" id="jsonType" value="json"> JSON-->
                        <!--</div>-->
                        <!--</div>-->
                        <div class="form-group row" style="padding-left: 14px">
                            <button type="reset" class="btn btn-default" @click="${this.clearFields}">Reset</button>
                            <button type="submit" class="btn btn-default" @click="${this.execute}">Submit</button>
                        </div>
    
                        <!-- Result -->
                        ${this.checkResult(this.result) ? html`
                            <div class="col-xs-3" style="padding-left: 0px">
                                <div class="panel panel-primary">
                                    <div class="panel-heading">
                                        <h3 class="panel-title">Response</h3>
                                    </div>
                                    <div class="panel-body">
                                        <span id="BeaconResponse">Exists: ${this.result}</span>
                                    </div>
                                </div>
                            </div>
                        ` : null}
                    </div>
                </div>
    
                <br>
                <div class="col-md-10 col-md-offset-1">
                    <h3 style="margin: 10px 5px 15px 50px">Beacon Network</h3>
                    <div style="width: 60%; margin-left: 100px">
                        <variant-beacon-network .variant="${this.variant}" .clear="${this.clear}" .config="${this._config}"></variant-beacon-network>
                    </div>
                </div>
            ` : html`
                <span style="text-align: center"><h3>No public projects available to browse. Please login to continue</h3></span>
            `}
        `;
    }
}

customElements.define("variant-beacon", VariantBeacon);

