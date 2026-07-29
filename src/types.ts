export interface Location {
  id: string
  name: string
  category: string
  overworld_x: number | null
  overworld_y: number | null
  overworld_z: number | null
  nether_x: number | null
  nether_y: number | null
  nether_z: number | null
  end_x: number | null
  end_y: number | null
  end_z: number | null
  description: string
  link_url: string
  link_title: string
  created_at: number
  updated_at: number
}

export interface Category {
  category: string
  count: number
}

export interface LocationForm {
  name: string
  category: string
  overworld_x: number | null
  overworld_y: number | null
  overworld_z: number | null
  nether_x: number | null
  nether_y: number | null
  nether_z: number | null
  end_x: number | null
  end_y: number | null
  end_z: number | null
  description: string
  link_url: string
  link_title: string
}
