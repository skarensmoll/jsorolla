/**
 * Created by Antonio Altamura on 08/10/2019.
 */

import {LitElement, html} from '/web_modules/lit-element.js';

export default class OpencgaLogin extends LitElement {
    
    constructor() {
        super();
        this.userName = "";
        this.password = "";
        this.buttonText = "Sign in";
        this.notifyEventMessage = "messageevent";
    }
    createRenderRoot() {
        return this;
    }

    static get properties() {
        return {
            opencgaClient: {
                type: Object
            },
            buttonText: {
                type: String
            },
            userName: {
                type: String
            },
            password: {
                type: String
            },
            notifyEventMessage: {
                type: String
            }
        }
    }

    //TODO recheck
    ready() {
        super.ready();
    }

    //connectedCallback in Polyer 2
    firstUpdated(changedProperties) {
        changedProperties.forEach((oldValue, propName) => {
            console.log(`${propName} changed. oldValue: ${oldValue}`);
        });
        $("#formLogin").validator('update');
        $("#formLogin").validator().on('submit', e => this.submitLogin(e));
    }

    submitLogin(e) {
        console.log("e", e)
        if (e.isDefaultPrevented()) {
            console.error("submitLogin() Error", e)
            // handle the invalid form...
            // this._clearHtmlDom(true);
        } else {
            // everything looks good!
            e.preventDefault();
            let user = document.getElementById("opencgaUser").value;
            let pass = document.getElementById("opencgaPassword").value;
            let _this = this;
            this.opencgaClient.users().login(user, pass)
                .then(function(response) {

                    document.getElementById("opencgaUser").value = "";
                    document.getElementById("opencgaPassword").value = "";
                    let sessionId =  response.response[0].result[0].id;
                    let decoded = jwt_decode(sessionId); //TODO expose as module
                    let dateExpired = new Date(decoded.exp * 1000);
                    let validTimeSessionId =  moment(dateExpired, "YYYYMMDDHHmmss").format('D MMM YY HH:mm:ss'); //TODO expose as module


                    _this.dispatchEvent(new CustomEvent('login', {
                        detail: {
                            userId: user,
                            sessionId: sessionId
                        },
                        bubbles: true,
                        composed: true
                    }));

                    _this.dispatchEvent(new CustomEvent(_this.notifyEventMessage, {
                        detail: {
                            message: "Welcome " + user +". Your session is valid until " + validTimeSessionId,
                            options: {
                                icon: 'fa fa-user',
                            },
                            type: UtilsNew.MESSAGE_SUCCESS
                        },
                        bubbles: true,
                        composed: true
                    }));
                })
                .catch(function(response) {
                    let _message = this.errorMessage = response.error;
                    this.dispatchEvent(new CustomEvent(_this.notifyEventMessage, {
                        detail: {
                            message: _message, type: UtilsNew.MESSAGE_ERROR
                        },
                        bubbles: true,
                        composed: true
                    }));
                }.bind(this));
        }

    }

    checkEnterKey(e) {
        if (e.keyCode === 13) {
            // this.login();
        }
    }

    render() {
        return html`
        <style include="jso-styles">
            .v-offset {
                margin-top: 90px;
            }

            .input-login {
                /*min-width: 200px;*/
            }

            .buttonL {
                /*min-width: 239px;*/
            }

            .label-login {
                /*color: rgb(142, 128, 125);*/
            }
        </style>
        <div class="container-fluid">
            <div class="row v-offset">
                <div class="col-md-12">
                    <form id="formLogin" data-toggle="validator" class="form-horizontal" role="form">
                        <div class="form-group has-feedback">
                            <label for="opencgaUser" class="control-label label-login">User ID</label>
                            <div class="input-group">
                                <span class="input-group-addon" id="username">
                                    <i class="fa fa-user fa-lg"></i>
                                </span>
                                <input id="opencgaUser" value="${this.userName}" type="text" pattern="^[_\\-A-z0-9]+$" maxlength="20" class="form-control input-login"
                                       placeholder="User ID (case sensitive)" aria-label="Recipient's username" aria-describedby="username" required data-required-error="This field is required">
                            </div>
                            <div class="help-block with-errors"></div>
                        </div>

                        <div class="form-group">
                            <label for="opencgaPassword" class="control-label label-login">Password</label>
                            <div class="input-group">
                                <span class="input-group-addon" id="password">
                                    <i class="fa fa-key"></i>
                                </span>
                                <input id="opencgaPassword" value="${this.password}" type="password" maxlength="20" class="form-control input-login"
                                       placeholder="Password" aria-describedby="password" required>
                            </div>
                        </div>

                        <div class="form-group">
                            <button type="submit" class="btn btn-lg btn-default btn-block buttonL">${this.buttonText}</button>
                        </div>

                    </form>
                </div>
            </div>
        </div>
        `;
    }
}

customElements.define('opencga-login',OpencgaLogin);
