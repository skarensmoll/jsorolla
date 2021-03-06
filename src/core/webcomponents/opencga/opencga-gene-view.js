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
import UtilsNew from "../../utilsNew.js";
import PolymerUtils from "../PolymerUtils.js";
import "../variant/opencga-variant-grid.js";
import "../variant/variant-protein-view.js";
import "../variant/opencga-variant-detail-view.js";


export default class OpencgaGeneView extends LitElement {

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
            cellbaseClient: {
                type: Object
            },
            opencgaClient: {
                type: Object
            },
            gene: {
                type: String
            },
            populationFrequencies: {
                type: Array
            },
            proteinSubstitutionScores: {
                type: Object
            },
            consequenceTypes: {
                type: Object
            },
            variant: {
                type: String
            },
            config: {
                type: Object
            },
            summary: {
                type: Boolean
            },
            /*project: {
                type: Object
            },
            study: {
                type: Object
            }*/
        };
    }

    _init() {
        this._prefix = "geneView" + UtilsNew.randomString(6) + "_";
        this.variantId = "";
    }

    updated(changedProperties) {
        if (changedProperties.has("opencgaSession") || changedProperties.has("gene")) {
            this.geneChanged();
        }
        /*if (changedProperties.has("project") || changedProperties.has("study")) {
            this.projectStudyObtained();
        }*/
    }

    /*projectStudyObtained(project, study) {
        if (UtilsNew.isNotUndefined(this.opencgaSession.project) && UtilsNew.isNotEmpty(this.opencgaSession.project.alias) &&
            UtilsNew.isNotUndefined(this.opencgaSession.study) && UtilsNew.isNotEmpty(this.opencgaSession.study.alias)) {
            this.hashFragmentCredentials = {
                project: this.opencgaSession.project.alias,
                study: this.opencgaSession.study.alias
            };
        }
    }*/

    geneChanged(neo, old) {
        if (UtilsNew.isNotEmpty(this.gene)) {
            this.query = {
                gene: this.gene,
                study: this.opencgaSession.study.fqn
            };
            const _this = this;
            this.cellbaseClient.getGeneClient(this.gene, "info", {exclude: "annotation", assembly: this.opencgaSession.project.organism.assembly}, {})
                .then(function(response) {
                    _this.geneObj = response.getResult(0);
                    _this.requestUpdate();
                });
        }
    }

    updateQuery(e) {
        PolymerUtils.removeClass(".gene-ct-buttons", "active");
        PolymerUtils.addClass(e.target.id, "active");
        const query = this.query;
        switch (e.target.dataset.value) {
            case "missense":
                query.ct = "missense_variant";
                break;
            case "lof":
                query.ct = this.consequenceTypes.lof.join(",");
                break;
            default:
                delete query.ct;
                break;
        }
        this.query = {...query};
        this.requestUpdate();
    }

    checkVariant(variant) {
        return variant?.split(":").length > 2;
    }

    showBrowser() {
        const hash = window.location.hash.split("/");
        const newHash = "#browser/" + hash[1] + "/" + hash[2];
        window.location.hash = newHash;
    }

    onSelectVariant(e) {
        this.variantId = e.detail.id;
        this.requestUpdate();
    }

    render() {
        return this.geneObj ? html`
        <tool-header title="${`Gene <span class="inverse"> ${this.geneObj.name} </span>` }" icon="gene-view.svg"></tool-header>
        <div class="container-fluid">
            <div class="row">
                <div class="col-md-10 col-md-offset-1">
                    <!--<div style="float: right;padding: 10px 5px 10px 5px">
                        <button type="button" class="btn btn-primary" @click="${this.showBrowser}">
                            <i class="fa fa-hand-o-left" aria-hidden="true"></i> Variant Browser
                        </button>
                    </div>-->
        
                    <div class="row" style="padding: 5px 0px 25px 0px">
                        <div class="col-md-4">
                            <h3 class="section-title">Summary</h3>
                            <table width="100%">
                                <tr>
                                    <td class="gene-summary-title" width="20%">Name</td>
                                    <td width="80%">${this.geneObj.name} (${this.geneObj.id})</td>
                                </tr>
                                <tr>
                                    <td class="gene-summary-title" width="20%">Biotype</td>
                                    <td width="80%">${this.geneObj.biotype}</td>
                                </tr>
                                <tr>
                                    <td class="gene-summary-title" width="20%">Description</td>
                                    <td width="80%">${this.geneObj.description}</td>
                                </tr>
                                <tr>
                                    <td class="gene-summary-title">Location</td>
                                    <td>${this.geneObj.chromosome}:${this.geneObj.start}-${this.geneObj.end} (${this.geneObj.strand})</td>
                                </tr>
                                <tr>
                                    <td class="gene-summary-title">Genome Browser</td>
                                    <td>
                                        ${application.appConfig === "opencb" ? html`
                                            <a target="_blank" href="http://genomemaps.org/?region=${this.geneObj.chromosome}:${this.geneObj.start}-${this.geneObj.end}">
                                            ${this.geneObj.chromosome}:${this.geneObj.start}-${this.geneObj.end}
                                            </a>
                                        ` : html`${this.geneObj.chromosome}:${this.geneObj.start}-${this.geneObj.end}`}
                                    </td>
                                </tr>
                            </table>
                        </div>
        
                        <div class="col-md-8">
                            <h3 class="section-title">Transcripts</h3>
                            <table class="table table-bordered" width="100%">
                                <thead style="background-color: #eeeeee">
                                <tr>
                                    <th>Name</th>
                                    <th>Ensembl ID</th>
                                    <th>Biotype</th>
                                    <th>Location</th>
                                    <th>Coding</th>
                                    <!--<th>cDNA</th>-->
                                    <!--<th>CDS Length</th>-->
                                    <th>Flags</th>
                                </tr>
                                </thead>
                                <tbody>
                                ${this.geneObj.transcripts && this.geneObj.transcripts.length ? this.geneObj.transcripts.map( transcript => html`
                                    <tr>
                                        <td>${transcript.name}</td>
                                        <td>
                                            ${application.appConfig === "opencb" ? html`
                                                <a href="#transcript/${this.opencgaSession.project.alias}/${this.opencgaSession.study.alias}/${transcript.id}">${transcript.id}</a>
                                            ` : html`
                                                <a href="http://www.ensembl.org/Multi/Search/Results?q=${transcript.id};site=ensembl;page=1;facet_feature_type=Transcript" target="_blank">${transcript.id}</a>
                                            `}
                                        </td>
                                        <td>${transcript.biotype}</td>
                                        <td>
                                            ${application.appConfig === "opencb" ? html`
                                                <a target="_blank"
                                                   href="http://genomemaps.org/?region=${transcript.chromosome}:${transcript.start}-${transcript.end}">
                                                    ${transcript.chromosome}:${transcript.start}-${transcript.end}
                                                </a>` : html`<span>${transcript.chromosome}:${transcript.start}-${transcript.end}</span>`}
                                        </td>
                                        <td>
                                            ${application.appConfig === "opencb" ? html`
                                                <a target="_blank"
                                                   href="http://genomemaps.org/?region=${transcript.chromosome}:${transcript.genomicCodingStart}-${transcript.genomicCodingEnd}">
                                                    ${transcript.genomicCodingStart}-${transcript.genomicCodingEnd}
                                                </a>` : html`<span>${transcript.chromosome}:${transcript.start}-${transcript.end}</span>`}
                                        </td>
                                        <!--<td>-->
                                        <!--${transcript.cdnaCodingStart}-${transcript.cdnaCodingEnd}-->
                                        <!--</td>-->
                                        <!--<td>${transcript.cdsLength}</td>-->
                                        <td>${transcript.annotationFlags}</td>
                                    </tr>
                                `) : null }
                                </tbody>
                            </table>
                        </div>
                    </div>
        
                    ${application.appConfig === "opencb" ? html`
                        <ul id="${this._prefix}ViewTabs" class="nav nav-tabs" role="tablist">
                            <li role="presentation" class="active">
                                <a href="#${this._prefix}Variants" role="tab" data-toggle="tab" class="gene-variant-tab-title">Variants</a>
                            </li>
                            <li role="presentation">
                                <a href="#${this._prefix}Protein" role="tab" data-toggle="tab" class="gene-variant-tab-title">Protein (Beta)</a>
                            </li>
                        </ul>
                    ` : null}
            
                    <div class="tab-content" style="height: 1024px">
                        <div role="tabpanel" class="tab-pane active" id="${this._prefix}Variants">
                            <div class="btn-group pad15" role="group">
                                <button id="${this._prefix}AllConsTypeButton" type="button" class="btn btn-primary ripple gene-ct-buttons active" data-value="${"all"}" @click="${this.updateQuery}">
                                    All
                                </button>
                                <button id="${this._prefix}MissenseConsTypeButton" type="button" class="btn btn-primary ripple gene-ct-buttons" data-value="${"missense"}" @click="${this.updateQuery}">
                                    Missense
                                </button>
                                <button id="${this._prefix}LoFConsTypeButton" type="button" class="btn btn-primary ripple gene-ct-buttons" data-value="${"lof"}" @click="${this.updateQuery}">
                                    LoF
                                </button>
                            </div>
            
                            <!--<br>-->
                            <br>
                            <opencga-variant-grid .opencgaSession="${this.opencgaSession}"
                                                  .query="${this.query}"
                                                  .populationFrequencies="${this.populationFrequencies}"
                                                  .proteinSubstitutionScores="${this.proteinSubstitutionScores}"
                                                  .consequenceTypes="${this.consequenceTypes}"
                                                  .summary="${this.summary}"
                                                  .config="${this.config}"
                                                  @selectrow="${this.onSelectVariant}">
                            </opencga-variant-grid>
            
                            ${this.checkVariant(this.variantId) ? html`
                                <!-- Bottom tabs with specific variant information -->
                                    <opencga-variant-detail-view    .opencgaSession="${this.opencgaSession}" 
                                                                .cellbaseClient="${this.cellbaseClient}"
                                                                .variantId="${this.variantId}"
                                                                .config="${this._config?.filter?.detail}">
                                    </opencga-variant-detail-view>
                                    <!--
                                    <h3 class="break-word">Advanced Annotation for Variant: ${this.variantId}</h3>
                                    <cellbase-variantannotation-view .data="${this.variantId}"
                                                                     .cellbaseClient="${this.cellbaseClient}"
                                                                     .assembly=${this.opencgaSession.project.organism.assembly}
                                                                     .hashFragmentCredentials="${this.hashFragmentCredentials}"
                                                                     .populationFrequencies="${this.populationFrequencies}"
                                                                     .proteinSubstitutionScores="${this.proteinSubstitutionScores}"
                                                                     .consequenceTypes="${this.consequenceTypes}">
                                    </cellbase-variantannotation-view> -->
                            ` : null}
                        </div>
            
                        <div role="tabpanel" class="tab-pane" id="${this._prefix}Protein">
                            <variant-protein-view .opencgaSession="${this.opencgaSession}"
                                                  .opencgaClient="${this.opencgaClient}"
                                                  .cellbaseClient="${this.cellbaseClient}"
                                                  .gene="${this.gene}"
                                                  .config="${this.config.protein}"
                                                  .summary="${this.summary}">
                            </variant-protein-view>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        ` : null;
    }

}

customElements.define("opencga-gene-view", OpencgaGeneView);

