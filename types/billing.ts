export interface TeamBillingCharge {
    ChargePeriodStart: string
    ChargePeriodEnd: string
    ChargeCategory: string
    BilledCost: number
    BillingCurrency: string
    EffectiveCost: number
    ServiceName: string
    ServiceCategory: string
    ServiceProviderName: string
    ConsumedQuantity: number
    ConsumedUnit: string
    Tags: Record<string, string>
    PricingCategory: string
    PricingCurrency: string
    PricingQuantity: number
    PricingUnit: string
    RegionId?: string
    RegionName?: string
}
