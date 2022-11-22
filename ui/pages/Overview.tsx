import React, { ReactElement, useState } from "react"
import {
  getAddressCount,
  getNetworkCountForOverview,
  getTotalBalanceForOverview,
  selectAccountAndTimestampedActivities,
  selectAccountTotalsForOverview,
} from "@tallyho/tally-background/redux-slices/selectors"
import { selectInitializationTimeExpired } from "@tallyho/tally-background/redux-slices/ui"
import { FeatureFlags, isEnabled } from "@tallyho/tally-background/features"
import { useBackgroundSelector } from "../hooks"
import OverviewAssetsTable from "../components/Overview/OverviewAssetsTable"
import SharedPanelSwitcher from "../components/Shared/SharedPanelSwitcher"
import NFTsOverview from "../components/NFTs/NFTsOverview"
import SharedBanner from "../components/Shared/SharedBanner"
import BalanceHeader from "../components/Overview/BalanceHeader"
import NetworksChart from "../components/Overview/NetworksChart"
import AccountList from "../components/Overview/AccountList"
import AchievementsOverview from "../components/NFTs/AchievementsOverview"
import CorePage from "../components/Core/CorePage"

const panelNames = ["Assets", "NFTs"]

if (isEnabled(FeatureFlags.ENABLE_ACHIEVEMENTS_TAB)) {
  panelNames.push("Achievements")
}

export default function Overview(): ReactElement {
  const [panelNumber, setPanelNumber] = useState(0)
  const accountsTotal = useBackgroundSelector(selectAccountTotalsForOverview)
  const balance = useBackgroundSelector(getTotalBalanceForOverview)
  const networksCount = useBackgroundSelector(getNetworkCountForOverview)
  const accountsCount = useBackgroundSelector(getAddressCount)

  const { combinedData } = useBackgroundSelector(
    selectAccountAndTimestampedActivities
  )
  const initializationLoadingTimeExpired = useBackgroundSelector(
    selectInitializationTimeExpired
  )

  return (
    <CorePage hasTabBar>
      <section className="stats">
        <BalanceHeader
          balance={balance}
          initializationTimeExpired={initializationLoadingTimeExpired}
        />
        <AccountList
          accountsTotal={accountsTotal}
          accountsCount={accountsCount}
        />
        <NetworksChart
          accountsTotal={accountsTotal}
          networksCount={networksCount}
        />
      </section>
      <div className="panel_switcher">
        <SharedPanelSwitcher
          setPanelNumber={setPanelNumber}
          panelNumber={panelNumber}
          panelNames={panelNames}
        />
      </div>
      {panelNumber === 0 && (
        <OverviewAssetsTable
          assets={combinedData.assets}
          initializationLoadingTimeExpired={initializationLoadingTimeExpired}
        />
      )}
      {panelNumber === 1 && (
        <>
          <SharedBanner
            icon="notif-announcement"
            iconColor="var(--link)"
            canBeClosed
            id="nft_soon"
            customStyles="margin: 8px 0;"
          >
            Coming soon: NFT price + sending
          </SharedBanner>
          <NFTsOverview />
        </>
      )}
      {panelNumber === 2 && <AchievementsOverview />}
      <style jsx>
        {`
          .stats {
            padding: 16px 16px 24px;
            width: calc(100% - 32px);
          }
          .panel_switcher {
            width: 100%;
          }
        `}
      </style>
    </CorePage>
  )
}
