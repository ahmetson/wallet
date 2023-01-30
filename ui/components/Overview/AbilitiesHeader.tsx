import { toggleHideDescription } from "@tallyho/tally-background/redux-slices/abilities"
import {
  selectAbilityCount,
  selectDescriptionHidden,
} from "@tallyho/tally-background/redux-slices/selectors"
import classNames from "classnames"
import React, { ReactElement } from "react"
import { useTranslation } from "react-i18next"
import { useSelector } from "react-redux"
import { useHistory } from "react-router-dom"
import { useBackgroundDispatch } from "../../hooks"
import SharedButton from "../Shared/SharedButton"

export default function AbilitiesHeader(): ReactElement {
  const { t } = useTranslation("translation", {
    keyPrefix: "abilities",
  })
  const newAbilities = useSelector(selectAbilityCount)
  const hideDescription = useSelector(selectDescriptionHidden)
  const dispatch = useBackgroundDispatch()
  const history = useHistory()

  const abilityCount =
    newAbilities > 0 ? `${newAbilities} ${t("banner.new")}` : t("banner.none")

  const handleClick = () => {
    if (!hideDescription) {
      dispatch(toggleHideDescription(true))
    }
    history.push("abilities")
  }

  return (
    <div
      className={classNames("abilities_header", {
        init_state: !hideDescription,
      })}
    >
      <div className="info_container">
        <div className="abilities_info">
          <div className="icon_tail" />
          <div
            className={classNames({
              header: !hideDescription,
            })}
          >
            {t("header")}
          </div>
        </div>
        <div
          tabIndex={0}
          role="button"
          className="ability_count"
          onClick={() => handleClick()}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleClick()
            }
          }}
        >
          {abilityCount}
        </div>
      </div>
      {!hideDescription && (
        <div>
          <div className="desc">{t("banner.description")}</div>
          <SharedButton
            type="primary"
            size="medium"
            onClick={() => handleClick()}
          >
            {t("banner.seeAbilities")}
          </SharedButton>
        </div>
      )}
      <style jsx>{`
        .info_container {
          display: flex;
          flex-direction: row;
          justify-content: space-between;
          align-items: center;
        }

        .abilities_header {
          background: var(--green-95);
          border-radius: 8px;
          background: radial-gradient(
              78.69% 248.21% at 114.77% 133.93%,
              rgba(9, 86, 72, 0.85) 0%,
              rgba(0, 37, 34, 0) 100%
            ),
            radial-gradient(
              78.69% 248.21% at 0% -133.93%,
              rgb(247, 103, 52, 0.3) 0%,
              rgba(19, 48, 46, 0.5) 100%
            );

          padding: 12px 16px 12px 12px;
          width: 100%;
          box-sizing: border-box;
        }

        .abilities_header.init_state {
          background: radial-gradient(
            103.39% 72.17% at -5.73% -7.67%,
            rgb(247, 103, 52, 0.5) 0%,
            rgba(19, 48, 46, 0.5) 100%
          );
          box-shadow: 0px 16px 16px rgba(7, 17, 17, 0.3),
            0px 6px 8px rgba(7, 17, 17, 0.24), 0px 2px 4px rgba(7, 17, 17, 0.34);
        }

        .abilities_info {
          display: flex;
          flex-direction: row;
          align-items: center;

          color: var(--white);
          font-weight: 400;
          font-size: 16px;
          line-height: 24px;
        }

        .header {
          font-weight: 600;
          font-size: 18px;
        }

        .ability_count {
          display: flex;
          flex-direction: row;
          align-items: center;
          justify-content: center;
          background: var(--hunter-green);
          border-radius: 17px;
          padding: 0px 8px;
          cursor: pointer;
          height: 24px;

          font-weight: 500;
          font-size: 14px;
          line-height: 16px;
          letter-spacing: 0.03em;
          color: var(--${newAbilities > 0 ? "success" : "green-40"});
        }

        .desc {
          font-weight: 500;
          font-size: 16px;
          line-height: 24px;
          color: var(--green-20);
          margin: 8px 0 16px;
        }

        .icon_tail {
          background: url("./images/tail.svg");
          background-size: 32px 32px;
          width: 32px;
          height: 32px;
          margin-right: 8px;
          border-radius: 24px;
        }
      `}</style>
    </div>
  )
}
