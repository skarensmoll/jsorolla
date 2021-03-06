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
import "../commons/view/data-form.js";
import "../commons/view/pedigree-view.js";
import CatalogGridFormatter from "../commons/catalog-grid-formatter.js";


export default class OpencgaClinicalAnalysisView extends LitElement {

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
        this._config = this.getDefaultConfig();
    }

    connectedCallback() {
        super.connectedCallback();

        this._config = {...this.getDefaultConfig(), ...this.config};
        this.catalogGridFormatter = new CatalogGridFormatter(this.opencgaSession);
    }

    updated(changedProperties) {
        if (changedProperties.has("clinicalAnalysisId")){
            this.clinicalAnalysisIdObserver();
        }

        if (changedProperties.has("config")) {
            this._config = {...this.getDefaultConfig(), ...this.config};
        }
    }

    clinicalAnalysisIdObserver() {
        if (this.opencgaSession && this.clinicalAnalysisId) {
            this.opencgaSession.opencgaClient.clinical().info(this.clinicalAnalysisId, {study: this.opencgaSession.study.fqn})
                .then(response => {
                    if (response.responses[0].numResults === 1) {
                        this.clinicalAnalysis = response.responses[0].results[0];
                        this.requestUpdate();
                    }
                })
                .catch(function(reason) {
                    console.error(reason);
                });
        }
    }

    getDefaultConfig() {
        return {
            title: "Summary",
            icon: "",
            display: {
                collapsable: true,
                showTitle: false,
                // labelWidth: 3,
                defaultValue: "-",
                defaultLayout: "horizontal",
                buttons: {
                    show: false
                },
                layout: [
                    {
                        id: "",
                        classes: "row",
                        sections: [
                            {
                                id: "detail",
                                classes: "col-md-5"
                            },
                            {
                                id: "proband",
                                classes: "col-md-7"
                            }
                        ]
                    },
                    {
                        id: "family",
                        classes: ""
                    },
                    {
                        id: "files",
                        classes: ""
                    }
                ],
                // layout: [
                //     {
                //         id: "",
                //         classes: "col-md-6",
                //         sections: [
                //             {
                //                 id: "detail",
                //                 classes: "col-md-12"
                //             },
                //             {
                //                 id: "proband",
                //                 classes: "col-md-12"
                //             }
                //         ]
                //     },
                //     {
                //         // id: "family",
                //         classes: "col-md-6",
                //         sections: [
                //             {
                //                 id: "family",
                //                 classes: "col-md-12"
                //             },
                //             {
                //                 id: "files",
                //                 classes: "col-md-12"
                //             }
                //         ]
                //     }
                // ],
            },
            sections: [
                {
                    id: "detail",
                    title: "Details",
                    display: {
                        collapsed: false,
                        // leftColumnWith: 5,
                        // rightColumnWith: 5
                    },
                    elements: [
                        {
                            name: "Case ID",
                            field: "id",
                            display: {
                                labelWidth: 3,
                            }
                        },
                        {
                            name: "Proband",
                            field: "proband.id",
                            display: {
                                labelWidth: 3,
                            }
                        },
                        {
                            name: "Disorder",
                            field: "disorder",
                            type: "custom",
                            display: {
                                labelWidth: 3,
                                render: disorder => UtilsNew.renderHTML(this.catalogGridFormatter.disorderFormatter(disorder))
                            }
                        },
                        {
                            name: "Analysis Type",
                            field: "type",
                            display: {
                                visible: application.appConfig === "opencb",
                                // width: 9,
                                labelWidth: 3,
                            }
                        },
                        {
                            name: "Flags",
                            field: "flags",
                            type: "list",
                            display: {
                                visible: application.appConfig === "opencb",
                                labelWidth: 3,
                                contentLayout: "horizontal",
                                render: field => {
                                    return html`<span class="badge badge-secondary">${field}</span>`
                                }
                            }
                        },
                        {
                            name: "Status",
                            field: "status.name",
                            display: {
                                visible: application.appConfig === "opencb",
                                labelWidth: 3,
                            }
                        },
                        {
                            name: "Description",
                            field: "description",
                            display: {
                                visible: application.appConfig === "opencb",
                                labelWidth: 3,
                                errorMessage: "-"
                            }
                        },
                        {
                            name: "Priority",
                            field: "priority",
                            type: "custom",
                            display: {
                                visible: application.appConfig === "opencb",
                                labelWidth: 3,
                                render: clinicalAnalysis => {
                                    let colors = {"URGENT": "red", "HIGH": "darkorange"};
                                    return html`<span style="color: ${colors[clinicalAnalysis.priority]}">${clinicalAnalysis.priority}</span>`
                                }
                            }
                        },
                        {
                            name: "Assigned To",
                            field: "analyst.assignee",
                            display: {
                                visible: application.appConfig === "opencb",
                                labelWidth: 3,
                            }
                        },
                        {
                            name: "Creation date",
                            field: "creationDate",
                            type: "custom",
                            display: {
                                labelWidth: 3,
                                visible: application.appConfig === "opencb",
                                render: creationDate => html`${moment(creationDate, "YYYYMMDDHHmmss").format("D MMM YY")}`
                            }
                        },
                        {
                            name: "Due date",
                            field: "dueDate",
                            type: "custom",
                            display: {
                                labelWidth: 3,
                                visible: application.appConfig === "opencb",
                                render: dueDate => html`${moment(dueDate, "YYYYMMDDHHmmss").format("D MMM YY")}`
                            }
                        },
                    ]
                },
                {
                    id: "proband",
                    title: "Proband",
                    elements: [
                        {
                            name: "Proband",
                            field: "proband.id"
                        },
                        {
                            name: "Sex (Karyotypic)",
                            type: "complex",
                            display: {
                                template: "${proband.sex} (${proband.karyotypicSex})",
                            }
                        },
                        {
                            name: "Date of Birth",
                            type: "complex",
                            display: {
                                template: "${proband.dateOfBirth} (${proband.lifeStatus})",
                            }
                        },
                        {
                            name: "Disorders",
                            field: "proband.disorders",
                            type: "list",
                            display: {
                                contentLayout: "bullets",
                                render: disorder => {
                                    let id = disorder.id;
                                    if (disorder.id.startsWith("OMIM:")) {
                                        id = html`<a href="https://omim.org/entry/${disorder.id.split(":")[1]}" target="_blank">${disorder.id}</a>`;
                                    }
                                    return html`${disorder.name} (${id})`
                                },
                                defaultValue: "N/A"
                            }
                        },
                        {
                            name: "Phenotypes",
                            field: "proband.phenotypes",
                            type: "list",
                            display: {
                                contentLayout: "bullets",
                                render: phenotype => {
                                    let id = phenotype.id;
                                    if (phenotype.id.startsWith("HP:")) {
                                        id = html`<a href="https://hpo.jax.org/app/browse/term/${phenotype.id}" target="_blank">${phenotype.id}</a>`;
                                    }
                                    return html`${phenotype.name} (${id})`
                                },
                                defaultValue: "N/A"
                            }
                        },
                        {
                            name: "Samples",
                            field: "proband.samples",
                            type: "table",
                            display: {
                                columns: [
                                    {
                                        name: "ID", field: "id"
                                    },
                                    {
                                        name: "Files", field: "filedIds"
                                    },
                                    {
                                        name: "Collection Method", field: "collection.method", defaultValue: "-"
                                    },
                                    {
                                        name: "Preparation Method", field: "processing.preparationMethod", defaultValue: "-"
                                    },
                                    {
                                        name: "Somatic", field: "somatic"
                                    },
                                    {
                                        name: "Creation Date",
                                        field: "creationDate",
                                        type: "custom", // this is not needed. feels right though
                                        display: {
                                            render: creationDate => html`${moment(creationDate, "YYYYMMDDHHmmss").format("D MMM YY")}`
                                        }
                                    },
                                    {
                                        name: "Status", field: "status.name", defaultValue: "-"
                                    }
                                ],
                                defaultValue: "No sample found"
                            }
                        }
                    ]
                },
                {
                    id: "family",
                    title: "Family",
                    display: {
                        visible: data => data.type === "FAMILY",
                    },
                    elements: [
                        {
                            name: "Family ID",
                            field: "family.id",
                        },
                        {
                            name: "Name",
                            field: "family.name"
                        },
                        {
                            name: "Members",
                            field: "family",
                            type: "custom",
                            display: {
                                layout: "vertical",
                                defaultLayout: "vertical",
                                width: 12,
                                style: "padding-left: 0px",
                                render: family => {
                                    if (family && family.members) {
                                        let individualGridConfig = {
                                            showSelectCheckbox: false,
                                            showToolbar: false
                                        };
                                        return html`
                                            <opencga-individual-grid .opencgaSession="${this.opencgaSession}" 
                                                                     .individuals="${family.members}" 
                                                                     .config="${individualGridConfig}"
                                                                     @filterChange="${e => this.onFamilyChange(e)}">
                                            </opencga-individual-grid>
                                        `;
                                    }
                                },
                                errorMessage: "No family selected"
                            },
                        },
                        // {
                        //     name: "Members JSON",
                        //     field: "family.members",
                        //     type: "json"
                        // },
                        {
                            name: "Pedigree",
                            type: "custom",
                            display: {
                                //visible: data => data?.family?.members?.length > 2,
                                visible: data => application.appConfig === "opencb", //TODO pedigree doesnt work with families with over 2 generations
                                layout: "vertical",
                                render: clinicalAnalysis => html`<pedigree-view .family="${clinicalAnalysis.family}"></pedigree-view>`
                            }
                        }
                    ]
                },
                {
                    id: "files",
                    title: "Files",
                    elements: [
                        {
                            name: "File",
                            field: "files",
                            type: "list",
                            display: {
                                contentLayout: "bullets",
                                template: "${name}"
                            }
                        }
                    ]
                }
            ]
        }
    }

    render() {
        return html`
            <data-form .data=${this.clinicalAnalysis} .config="${this._config}"></data-form>
        `;
    }

}

customElements.define("opencga-clinical-analysis-view", OpencgaClinicalAnalysisView);
