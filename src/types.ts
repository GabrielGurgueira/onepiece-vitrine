export type AdType = 'venda' | 'compra'
export type CardCondition = 'NM' | 'SP' | 'MP' | 'D'
export type ListingStatus = 'ativo' | 'vendido' | 'encerrado'
export type ContactType = 'whatsapp' | 'discord'

export interface Profile {
  id: string
  display_name: string
  whatsapp: string | null
  discord: string | null
  created_at: string
}

export interface Listing {
  id: string
  seller_id: string
  ad_type: AdType
  card_name: string
  card_code: string | null
  reference_image: string | null
  set_name: string | null
  set_release_date: string | null
  rarity: string | null
  color: string | null
  condition: CardCondition | null
  price: number | null
  quantity: number
  description: string | null
  images: string[]
  status: ListingStatus
  created_at: string
  profiles?: Profile | null
}

export const CONDITION_LABELS: Record<CardCondition, string> = {
  NM: 'Near Mint (NM)',
  SP: 'Slightly Played (SP)',
  MP: 'Moderately Played (MP)',
  D: 'Danificada (D)',
}

export const AD_TYPE_LABELS: Record<AdType, string> = {
  venda: 'Venda',
  compra: 'Procuro',
}
