import { expect, it } from 'vitest'
import { productSections } from '../../../src/ui/overview/product-details'

it('declares ISA assets, holdings, and cash sections without pension loan', () => {
  expect(productSections.isa.map(({ type }) => type)).toEqual(['assets', 'holdings', 'cash'])
})
