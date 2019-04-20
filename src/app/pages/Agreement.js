import React, { Component } from "react";
import state from "../../state";
import { observer } from "mobx-react";
import { action } from "mobx";
import { withRouter } from "react-router-dom";
import TokenProgressBar from "../components/TokenProgressBar";
import "./AgreementPage.scss";
import { myAgreementsPagePath } from "../../constants";
import { getPathForRouter } from "../../utils";
import * as Trickle from "../../ethereum/Trickle";
import { agreementPagePath } from "../../constants";
import { startLoading, completeLoading } from "./Loading";
import { Combobox, DateTimePicker } from "react-widgets";

@observer
export default class Agreement extends Component {

    // this.props["agreementId"] is available

    async cancelAgreementButtonClick (history) {
        startLoading(
            history,
            getPathForRouter(agreementPagePath),
            "Cancelling your agreement...",
            "Your submit transaction is being mined, please wait"
        );

        await Trickle.cancelAgreement(this.props.agreementId);

        completeLoading(history);
    }

    async withdrawButtonClick (history) {
        startLoading(
            history,
            getPathForRouter(agreementPagePath, {agreementId: this.props.agreementId}),
            "Withdraw your tokens...",
            "Your submit transaction is being mined, please wait"
        );

        await Trickle.withdrawTokens(this.props.agreementId);

        completeLoading(history);
    }

    BackToAgreementsButton = withRouter(({ history }) => (
        <input type="submit"
               onClick={ () => { history.push(getPathForRouter(myAgreementsPagePath)) } }
               value="← Back to Agreements"/>
    ));

    CancelAgreementButton = withRouter(({ history }) => (
        <input type="submit"
               className="negative"
               onClick={ this.cancelAgreementButtonClick.bind(this, history) }
               value="Cancel Agreement"/>
    ));

    WithdrawButton = withRouter(({ history }) => (
        <input type="submit"
               onClick={ this.withdrawButtonClick.bind(this, history) }
               value="Withdraw"/>
    ));

    @action
    async componentDidMount () {

        const agreement = await Trickle.getAgreement(this.props.agreementId);

        state.agreementRecipientAddress = agreement.recipient;
        state.agreementDuration = +agreement.duration;
        state.agreementStartDate = new Date(agreement.start * 1000);
        state.agreementSenderAddress = agreement.sender;
        state.agreementTokenAddress = agreement.token;
        state.agreementTokenValue = agreement.totalAmount.toString();
        state.agreementReleasedTokenValue = agreement.releasedAmount.toString();
        
        const [decimals, symbol] = await Promise.all([
            Trickle.getTokenDecimals(agreement.token),
            Trickle.getTokenSymbol(agreement.token)
        ]);

        state.agreementTokenDecimals = +decimals;
        state.agreementTokenSymbol = symbol;

    }

    render () {
        const { CancelAgreementButton, WithdrawButton, BackToAgreementsButton } = this;
        const now = new Date();
        const progress = Math.min(1, Math.max(0, (now.getTime() - state.agreementStartDate.getTime()) / (state.agreementDuration * 1000)));
        const status = progress <= 0
            ? "Scheduled"
            : progress >= 1
                ? "Completed"
                : "Active";
        return <div className="agreement-page">
            <h1 className="standard-padding center agreement-header">
                <div className="agreement icon"/>
                Agreement #{ this.props["agreementId"] }
            </h1>
            <div className="center subtext">Status: <strong className={ `status-${ status.toLowerCase() }` }>{ status }</strong></div>
            <div>
                <TokenProgressBar startDate={ state.agreementStartDate }
                                  duration={ state.agreementDuration }
                                  value={ state.agreementTokenValue / Math.pow(10, state.agreementTokenDecimals) }
                                  releasedValue={ state.agreementReleasedTokenValue / Math.pow(10, state.agreementTokenDecimals) }
                                  decimals={ state.agreementTokenDecimals }
                                  tokenSymbol={ state.agreementTokenSymbol }/>
            </div>
            <div className="single form-input">
                <div className="label"><strong>Recipient</strong>'s Ethereum Account</div>
                <div>
                    <Combobox data={[state.agreementRecipientAddress]}
                              value={ state.agreementRecipientAddress }
                              readOnly
                              selectIcon={ <div className="tiny copy icon"/> }/>
                </div>
            </div>
            <div className="single form-input">
                <div className="label">Sender's Ethereum Account</div>
                <div>
                    <Combobox data={[state.agreementSenderAddress]}
                              value={ state.agreementSenderAddress }
                              readOnly
                              selectIcon={ <div className="tiny copy icon"/> }/>
                </div>
            </div>
            <div className="center buttons">
                <WithdrawButton/>
                <CancelAgreementButton/>
                <BackToAgreementsButton/>
            </div>
        </div>
    }

}