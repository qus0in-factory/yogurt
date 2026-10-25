import { render, screen } from '@testing-library/react'
import { expect, it } from 'vitest'
import { SectionHeading } from '../../../src/ui/components/SectionHeading'

it('uses the shared card heading scale and requested heading level', () => {
  render(<SectionHeading level={2}>자산</SectionHeading>)
  expect(screen.getByRole('heading', { level: 2, name: '자산' }).className).toContain('text-base')
})
