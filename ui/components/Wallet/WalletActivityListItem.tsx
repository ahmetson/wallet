import React, { ReactElement, useEffect, useRef, useState } from "react"
import dayjs from "dayjs"
import classNames from "classnames"
import { ActivityItem } from "@tallyho/tally-background/redux-slices/activities"
import {
  isMaxUint256,
  sameEVMAddress,
  truncateAddress,
} from "@tallyho/tally-background/lib/utils"
import { HexString } from "@tallyho/tally-background/types"
import { getRecipient } from "@tallyho/tally-background/redux-slices/utils/activity-utils"
import { useTranslation } from "react-i18next"
import SharedAssetIcon from "../Shared/SharedAssetIcon"

interface Props {
  onClick: () => void
  activity: ActivityItem
  asAccount: string
}

function isReceiveActivity(activity: ActivityItem, account: string): boolean {
  return (
    activity.annotation?.type === "asset-transfer" &&
    sameEVMAddress(activity.annotation?.recipient?.address, account)
  )
}

function isSendActivity(activity: ActivityItem, account: string): boolean {
  return activity.annotation?.type === "asset-transfer"
    ? sameEVMAddress(activity.annotation?.sender?.address, account)
    : true
}

export default function WalletActivityListItem(props: Props): ReactElement {
  const { t } = useTranslation("translation", {
    keyPrefix: "wallet.activities",
  })
  const { onClick, activity, asAccount } = props
  const outcomeRef = useRef<HTMLDivElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const [outcomeWidth, setOutcomeWidth] = useState(0)
  const [bottomWidth, setBottomWidth] = useState(0)

  useEffect(() => {
    if (outcomeRef.current) {
      setOutcomeWidth(outcomeRef.current.offsetWidth)
    }
  }, [outcomeRef])

  useEffect(() => {
    if (bottomRef.current) {
      setBottomWidth(bottomRef.current.offsetWidth)
    }
  }, [bottomRef])

  // TODO Replace this with better conditional rendering.
  let renderDetails: {
    iconClass: string | undefined
    label: string
    recipient: {
      address: HexString | undefined
      name?: string | undefined
    }
    assetLogoURL: string | undefined
    assetSymbol: string
    assetValue: string
  } = {
    iconClass: undefined,
    label: t("contractInteraction"),
    recipient: getRecipient(activity),
    assetLogoURL: undefined,
    assetSymbol: activity.asset.symbol,
    assetValue: activity.localizedDecimalValue,
  }

  switch (activity.annotation?.type) {
    case "asset-transfer":
      renderDetails = {
        ...renderDetails,
        label: isReceiveActivity(activity, asAccount)
          ? t("tokenReceived")
          : t("tokenSent"),
        iconClass: isReceiveActivity(activity, asAccount)
          ? "receive_icon"
          : "send_icon",
        assetLogoURL: activity.annotation.transactionLogoURL,
        assetSymbol: activity.annotation.assetAmount.asset.symbol,
        assetValue: activity.annotation.assetAmount.localizedDecimalAmount,
      }
      break
    case "asset-approval":
      renderDetails = {
        label: t("tokenApproved"),
        iconClass: "approve_icon",
        recipient: {
          address: activity.annotation.spender.address,
          name: activity.annotation.spender.annotation?.nameRecord?.resolved
            .nameOnNetwork.name,
        },
        assetLogoURL: activity.annotation.transactionLogoURL,
        assetSymbol: activity.annotation.assetAmount.asset.symbol,
        assetValue: isMaxUint256(activity.annotation.assetAmount.amount)
          ? t("infiniteApproval")
          : activity.annotation.assetAmount.localizedDecimalAmount,
      }
      break
    case "asset-swap":
      renderDetails = {
        iconClass: "swap_icon",
        label: t("tokenSwapped"),
        recipient: getRecipient(activity),
        assetLogoURL: activity.annotation.transactionLogoURL,
        assetSymbol: activity.asset.symbol,
        assetValue: activity.localizedDecimalValue,
      }
      break
    case "contract-deployment":
    case "contract-interaction":
    default:
      renderDetails = {
        iconClass: "contract_interaction_icon",
        label: t("contractInteraction"),
        recipient: getRecipient(activity),
        // TODO fall back to the asset URL we have in metadata
        assetLogoURL: activity.annotation?.transactionLogoURL,
        assetSymbol: activity.asset.symbol,
        assetValue: activity.localizedDecimalValue,
      }
  }

  return (
    <li>
      <button type="button" className="standard_width" onClick={onClick}>
        <div className="top">
          <div className="left">
            <div
              className={classNames("activity_icon", renderDetails.iconClass)}
            />
            {renderDetails.label}
            {"status" in activity &&
            activity.blockHash !== null &&
            activity.status !== 1 ? (
              <div className="status failed">{t("transactionFailed")}</div>
            ) : (
              <></>
            )}
            {"status" in activity &&
            activity.blockHash === null &&
            activity.status === 0 ? (
              <div className="status dropped">{t("transactionDropped")}</div>
            ) : (
              <></>
            )}
            {!("status" in activity) && activity.blockHash === null ? (
              <div className="status pending">{t("transactionPending")}</div>
            ) : (
              <></>
            )}
          </div>
          <div className="right">
            {activity.annotation?.blockTimestamp &&
              dayjs.unix(activity.annotation?.blockTimestamp).format("MMM D")}
          </div>
        </div>
        <div ref={bottomRef} className="bottom">
          <div className="left">
            <div className="token_icon_wrap">
              <SharedAssetIcon
                // TODO this should come from a connected component that knows
                // about all of our asset metadata
                logoURL={renderDetails.assetLogoURL}
                symbol={renderDetails.assetSymbol}
                size="small"
              />
            </div>
            <div className="amount">
              <span
                className="bold_amount_count"
                title={renderDetails.assetValue}
              >
                {renderDetails.assetValue}
              </span>
              <span className="name">{renderDetails.assetSymbol}</span>
            </div>
          </div>
          <div ref={outcomeRef} className="right">
            {isSendActivity(activity, asAccount) ? (
              <div className="outcome" title={renderDetails.recipient.address}>
                {t("transactionTo")}
                {` ${
                  renderDetails.recipient.name ??
                  (renderDetails.recipient.address === undefined
                    ? t("contractCreation")
                    : truncateAddress(renderDetails.recipient.address))
                }`}
              </div>
            ) : (
              <div className="outcome" title={activity.from}>
                {t("transactionFrom")}
                {` ${activity.fromTruncated}`}
              </div>
            )}
          </div>
        </div>
      </button>
      <style jsx>
        {`
          button {
            height: 72px;
            border-radius: 16px;
            background-color: var(--green-95);
            display: flex;
            flex-direction: column;
            padding: 9px 19px 8px 8px;
            box-sizing: border-box;
            margin-bottom: 16px;
            justify-content: space-between;
            align-items: center;
          }
          button:hover {
            background-color: var(--green-80);
          }
          .activity_icon {
            background: url("./images/activity_contract_interaction@2x.png");
            background-size: cover;
            width: 14px;
            height: 14px;
            margin-right: 4px;
            margin-left: 9px;
          }
          .receive_icon {
            background: url("./images/activity_receive@2x.png");
            background-size: cover;
          }
          .send_icon {
            background: url("./images/activity_send@2x.png");
            background-size: cover;
          }
          .approve_icon {
            background: url("./images/activity_approve@2x.png");
            background-size: cover;
          }
          .swap_icon {
            background: url("./images/activity_swap@2x.png");
            background-size: cover;
          }
          .contract_interaction_icon {
            background: url("./images/activity_contract_interaction@2x.png");
            background-size: cover;
          }
          .status:before {
            content: "•";
            margin: 0 3px;
          }
          .failed {
            color: var(--error);
          }
          .pending {
            color: var(--attention);
          }
          .dropped {
            color: var(--green-20);
          }
          }
          .top {
            height: 16px;
            color: var(--green-40);
            font-size: 12px;
            font-weight: 500;
            line-height: 16px;
            display: flex;
            justify-content: space-between;
            width: 100%;
            align-items: center;
            margin-bottom: 2px;
          }
          .bottom {
            display: flex;
            width: 100%;
            justify-content: space-between;
            align-items: center;
          }
          .left {
            display: flex;
            align-items: center;
          }
          .token_icon_wrap {
            width: 32px;
            height: 32px;
            background-color: var(--hunter-green);
            border-radius: 80px;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .icon_eth {
            background: url("./images/eth@2x.png");
            background-size: 18px 29px;
            width: 18px;
            height: 29px;
            transform: scale(0.8);
          }
          .amount {
            color: #fefefc;
            font-size: 14px;
            font-weight: 400;
            letter-spacing: 0.42px;
            line-height: 16px;
            text-transform: uppercase;
            display: flex;
            flex-wrap: wrap;
            padding: 0px 8px;
            align-items: center;
          }
          .bold_amount_count {
            height: 24px;
            color: #fefefc;
            font-size: 18px;
            font-weight: 600;
            line-height: 24px;
            margin-right: 4px;
            max-width: calc(${bottomWidth}px - 50px - ${outcomeWidth}px);
            overflow: hidden;
            text-overflow: ellipsis;
            // For Infinite text in token approvals.
            text-transform: none;
          }
          .name {
            white-space: nowrap;
            padding-top: 3px;
          }
          .price {
            width: 58px;
            height: 17px;
            color: var(--green-40);
            font-size: 14px;
            font-weight: 400;
            letter-spacing: 0.42px;
            line-height: 16px;
          }
          .icon_send_asset {
            background: url("./images/send_asset.svg");
            background-size: 12px 12px;
            width: 12px;
            height: 12px;
          }
          .icon_swap_asset {
            background: url("./images/swap_asset.svg");
            background-size: 12px 12px;
            width: 12px;
            height: 12px;
          }
          .right {
            display: flex;
            justify-content: space-between;
            text-align: right;
            white-space: nowrap;
          }
          .outcome {
            color: var(--green-5);
            font-size: 14px;
            font-weight: 400;
            letter-spacing: 0.42px;
            text-align: right;
          }
        `}
      </style>
    </li>
  )
}
