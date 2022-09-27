/* eslint-disable react-hooks/exhaustive-deps */
import React, { ReactElement, useEffect, useState } from "react"
import {
  selectEstimatedFeesPerGas,
  selectTransactionData,
} from "@tallyho/tally-background/redux-slices/selectors/transactionConstructionSelectors"
import { updateTransactionData } from "@tallyho/tally-background/redux-slices/transaction-construction"
import type {
  EnrichedEIP1559TransactionRequest,
  EnrichedEVMTransactionRequest,
  EnrichedLegacyTransactionRequest,
} from "@tallyho/tally-background/services/enrichment"
import { useTranslation } from "react-i18next"
import { EIP_1559_COMPLIANT_CHAIN_IDS } from "@tallyho/tally-background/constants"
import { useBackgroundDispatch, useBackgroundSelector } from "../../hooks"
import FeeSettingsButton from "../NetworkFees/FeeSettingsButton"
import NetworkSettingsChooser from "../NetworkFees/NetworkSettingsChooser"
import SharedSlideUpMenu from "../Shared/SharedSlideUpMenu"
import SignTransactionDetailWarning from "./SignTransactionDetailWarning"

export type PanelState = {
  dismissedWarnings: string[]
}

type SignTransactionDetailPanelProps = {
  transactionRequest?: EnrichedEVMTransactionRequest
  defaultPanelState?: PanelState
}

// FIXME Move all of this into TransactionSignatureDetails/DetailsPanel once
// FIXME the new signature flow is enabled.
export default function SignTransactionDetailPanel({
  transactionRequest,
  defaultPanelState,
}: SignTransactionDetailPanelProps): ReactElement {
  const [panelState, setPanelState] = useState(
    defaultPanelState ?? { dismissedWarnings: [] }
  )
  const [networkSettingsModalOpen, setNetworkSettingsModalOpen] =
    useState(false)
  const [updateNum, setUpdateNum] = useState(0)

  const estimatedFeesPerGas = useBackgroundSelector(selectEstimatedFeesPerGas)

  const reduxTransactionData = useBackgroundSelector(selectTransactionData)
  // If a transaction request is passed directly, prefer it over Redux.
  const transactionDetails = transactionRequest ?? reduxTransactionData

  const dispatch = useBackgroundDispatch()

  const { t } = useTranslation()

  // Using useEffect here to avoid a race condition where updateTransactionData is
  // dispatched with old transactionDetails. transactionDetails is dependent on a
  // dispatching setFeeType, for example, inside NetworkSettingsChooser.
  useEffect(() => {
    if (transactionDetails) {
      dispatch(updateTransactionData(transactionDetails))
    }
    // Should trigger only on gas updates. If `transactionDetails` is a dependency, this will run constantly.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    updateNum,
    dispatch,
    (transactionDetails as EnrichedEIP1559TransactionRequest)?.maxFeePerGas,
    transactionDetails?.gasLimit,
    (transactionDetails as EnrichedLegacyTransactionRequest)?.gasPrice,
    (transactionDetails as EnrichedEIP1559TransactionRequest)?.maxFeePerGas,
  ])

  if (transactionDetails === undefined) return <></>

  const isEIP1559Compliant = EIP_1559_COMPLIANT_CHAIN_IDS.has(
    transactionDetails.network.chainID
  )

  const hasInsufficientFundsWarning =
    transactionDetails.annotation?.warnings?.includes("insufficient-funds")

  const isContractAddress =
    transactionDetails.annotation?.warnings?.includes("send-to-contract")

  const networkSettingsSaved = () => {
    setUpdateNum(updateNum + 1)

    setNetworkSettingsModalOpen(false)
  }

  return (
    <div className="detail_items_wrap standard_width_padded">
      <SharedSlideUpMenu
        size="custom"
        isOpen={networkSettingsModalOpen}
        close={() => setNetworkSettingsModalOpen(false)}
        customSize={`${
          3 * 56 +
          320 +
          (hasInsufficientFundsWarning ? 15 : 0) +
          (isEIP1559Compliant ? 0 : 40)
        }px`}
      >
        <NetworkSettingsChooser
          estimatedFeesPerGas={estimatedFeesPerGas}
          onNetworkSettingsSave={networkSettingsSaved}
        />
      </SharedSlideUpMenu>
      {hasInsufficientFundsWarning && (
        <span className="detail_item">
          <SignTransactionDetailWarning
            message={t("networkFees.insufficientBaseAsset", {
              symbol: transactionDetails.network.baseAsset.symbol,
            })}
          />
        </span>
      )}
      {isContractAddress &&
        !panelState.dismissedWarnings.includes("send-to-contract") && (
          <span className="detail_item">
            <SignTransactionDetailWarning
              message={t("wallet.sendToContractWarning")}
              dismissable
              onDismiss={() =>
                setPanelState((state) => ({
                  ...state,
                  dismissedWarnings: [
                    ...state.dismissedWarnings,
                    "send-to-contract",
                  ],
                }))
              }
            />
          </span>
        )}
      <span className="detail_item">
        {t("networkFees.estimatedNetworkFee")}
        <FeeSettingsButton onClick={() => setNetworkSettingsModalOpen(true)} />
      </span>
      <style jsx>
        {`
          .detail_item {
            width: 100%;
            color: var(--green-40);
            font-size: 14px;
            line-height: 16px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 10px;
          }
          .detail_items_wrap {
            display: flex;
            margin-top: 21px;
            flex-direction: column;
          }
          .detail_item_right {
            color: var(--green-20);
            font-size: 16px;
          }
        `}
      </style>
    </div>
  )
}
