import { ServiceCreatorFunction, ServiceLifecycleEvents } from "../types"
import BaseService from "../base"
import { HexString, NormalizedEVMAddress } from "../../types"
import {
  createSpamReport,
  DaylightAbility,
  DaylightAbilityRequirement,
  getDaylightAbilities,
} from "../../lib/daylight"
import { AbilitiesDatabase, getOrCreateDB } from "./db"
import ChainService from "../chain"
import { FeatureFlags, isEnabled } from "../../features"
import { normalizeEVMAddress } from "../../lib/utils"
import { Ability, AbilityRequirement } from "../../abilities"

const normalizeDaylightRequirements = (
  requirement: DaylightAbilityRequirement
): AbilityRequirement => {
  if (requirement.type === "hasTokenBalance") {
    return {
      type: "hold",
      address: requirement.address,
    }
  }

  if (requirement.type === "hasNftWithSpecificId") {
    return {
      type: "own",
      nftAddress: requirement.address,
    }
  }

  if (requirement.type === "onAllowlist") {
    return {
      type: "allowList",
    }
  }

  return {
    type: "unknown",
  }
}

const normalizeDaylightAbilities = (
  daylightAbilities: DaylightAbility[],
  address: string
): Ability[] => {
  const normalizedAbilities: Ability[] = []

  daylightAbilities.forEach((daylightAbility) => {
    normalizedAbilities.push({
      type: daylightAbility.type,
      title: daylightAbility.title,
      description: daylightAbility.description,
      abilityId: daylightAbility.uid,
      slug: daylightAbility.slug,
      linkUrl: daylightAbility.action.linkUrl,
      imageUrl: daylightAbility.imageUrl || undefined,
      openAt: daylightAbility.openAt || undefined,
      closeAt: daylightAbility.closeAt || undefined,
      completed: false,
      removedFromUi: false,
      address: normalizeEVMAddress(address),
      requirement: normalizeDaylightRequirements(
        // Just take the 1st requirement for now
        daylightAbility.requirements[0]
      ),
    })
  })

  return normalizedAbilities
}

interface Events extends ServiceLifecycleEvents {
  newAbilities: Ability[]
  newAccount: string
}
export default class AbilitiesService extends BaseService<Events> {
  constructor(
    private db: AbilitiesDatabase,
    private chainService: ChainService
  ) {
    super({
      abilitiesAlarm: {
        schedule: {
          periodInMinutes: 60,
        },
        runAtStart: true,
        handler: () => {
          this.abilitiesAlarm()
        },
      },
    })
  }

  static create: ServiceCreatorFunction<
    ServiceLifecycleEvents,
    AbilitiesService,
    [Promise<ChainService>]
  > = async (chainService) => {
    return new this(await getOrCreateDB(), await chainService)
  }

  protected override async internalStartService(): Promise<void> {
    await super.internalStartService()
    this.chainService.emitter.on("newAccountToTrack", (addressOnNetwork) => {
      const { address } = addressOnNetwork
      this.pollForAbilities(address)
      this.emitter.emit("newAccount", address)
    })
  }

  async pollForAbilities(address: HexString): Promise<void> {
    if (!isEnabled(FeatureFlags.SUPPORT_ABILITIES)) {
      return
    }

    const daylightAbilities = await getDaylightAbilities(address)
    const normalizedAbilities = normalizeDaylightAbilities(
      daylightAbilities,
      address
    )

    const newAbilities: Ability[] = []

    await Promise.all(
      normalizedAbilities.map(async (ability) => {
        const isNewAbility = await this.db.addNewAbility(ability)
        if (isNewAbility) {
          newAbilities.push(ability)
        }
      })
    )

    if (newAbilities.length) {
      this.emitter.emit("newAbilities", newAbilities)
    }
  }

  async markAbilityAsCompleted(
    address: NormalizedEVMAddress,
    abilityId: string
  ): Promise<void> {
    return this.db.markAsCompleted(address, abilityId)
  }

  async markAbilityAsRemoved(
    address: NormalizedEVMAddress,
    abilityId: string
  ): Promise<void> {
    return this.db.markAsRemoved(address, abilityId)
  }

  async abilitiesAlarm(): Promise<void> {
    const accountsToTrack = await this.chainService.getAccountsToTrack()
    const addresses = new Set(accountsToTrack.map((account) => account.address))

    // 1-by-1 decreases likelihood of hitting rate limit
    // eslint-disable-next-line no-restricted-syntax
    for (const address of addresses) {
      // eslint-disable-next-line no-await-in-loop
      await this.pollForAbilities(address)
    }
  }

  // eslint-disable-next-line class-methods-use-this
  async reportSpam(
    address: NormalizedEVMAddress,
    abilitySlug: string,
    reason: string
  ): Promise<void> {
    await createSpamReport(address, abilitySlug, reason)
  }
}
