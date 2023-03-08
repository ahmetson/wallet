import React, { ReactElement } from "react"
import { useTranslation } from "react-i18next"
import { selectHasInsufficientFunds } from "@tallyho/tally-background/redux-slices/selectors/transactionConstructionSelectors"
import { useBackgroundSelector } from "../../../hooks"
import SigningButton from "./SigningButton"
import SharedButton from "../../Shared/SharedButton"

type SignerBaseFrameProps = {
  signingActionLabel: string
  onConfirm: () => void
  onReject: () => void
  children: ReactElement
}

export default function SignerBaseFrame({
  children,
  signingActionLabel,
  onConfirm,
  onReject,
}: SignerBaseFrameProps): ReactElement {
  const { t } = useTranslation("translation", { keyPrefix: "signTransaction" })
  const hasInsufficientFunds = useBackgroundSelector(selectHasInsufficientFunds)

  return (
    <>
      <div className="signature-details">{children}</div>
      <footer>
        <SharedButton size="large" type="secondary" onClick={onReject}>
          {t("reject")}
        </SharedButton>

        <SigningButton
          type="primaryGreen"
          size="large"
          onClick={onConfirm}
          isDisabled={hasInsufficientFunds}
          showLoadingOnClick
        >
          {signingActionLabel}
        </SigningButton>
      </footer>
      <style jsx>
        {`
          .signature-details {
            /*
             * Adjust for fixed-position footer, plus some extra to visually
             * deal with the drop shadow.
             */
            margin-bottom: 84px;
          }
        `}
      </style>
    </>
  )
}
