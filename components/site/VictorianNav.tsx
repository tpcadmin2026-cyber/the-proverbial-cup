'use client'

import { useEffect } from 'react'
import type { NavItem } from '@prisma/client'

interface Page { id: string; tabNumeral: string; tabLabel: string; pageOrder: number; showInNav: boolean }

interface Props {
  pages: Page[]
  navItems: NavItem[]
}

export function VictorianNav({ pages, navItems }: Props) {
  useEffect(() => {
    // Build a merged, sorted list of all tabs into one horizontal bar.
    // Pages slide the viewport; nav items navigate to a URL.
    // A page with showInNav === false still slides into view (e.g. via a direct admin link)
    // but gets no entry in the bar.
    type PageTab = { kind: 'page'; rawId: string; num: string; label: string; pageIndex: number; order: number }
    type LinkTab = { kind: 'link'; num: string; label: string; href: string; openInNewTab: boolean; order: number }
    type Tab = PageTab | LinkTab

    // pageIndex always refers to the position in the full `pages` array (and pageEls below),
    // regardless of whether that page has a nav tab.
    const pageTabs: PageTab[] = pages
      .map((p, i) => ({
        kind: 'page' as const, rawId: p.id, num: p.tabNumeral, label: p.tabLabel,
        pageIndex: i, order: p.pageOrder, showInNav: p.showInNav,
      }))
      .filter((t) => t.showInNav)
      .map(({ showInNav: _showInNav, ...rest }) => rest)

    const linkTabs: LinkTab[] = navItems.map((n) => ({
      kind: 'link', num: n.numeral, label: n.label,
      href: n.href, openInNewTab: n.openInNewTab, order: n.navOrder,
    }))

    const ALL_TABS: Tab[] = [...pageTabs, ...linkTabs].sort((a, b) => a.order - b.order)

    const SLIDE = 500
    let cur = 0 // index into `pages` / `pageEls` (the full array, including nav-hidden pages)
    let locked = false

    const pageEls = pages.map((p) => document.getElementById(`page-${p.id}`))
    const bar = document.getElementById('tabs-bar')
    const vp  = document.getElementById('viewport')

    if (!bar || !vp) return

    function makeTab(tab: Tab, isCurrent: boolean) {
      if (tab.kind === 'link') {
        const a = document.createElement('a')
        a.href = tab.href
        if (tab.openInNewTab) { a.target = '_blank'; a.rel = 'noopener noreferrer' }
        a.className = 'pg-tab pg-tab-link'
        a.innerHTML = `<span class="tab-num">${tab.num}</span><span class="tab-label">${tab.label}</span>`
        return a
      }
      const b = document.createElement('button')
      b.className = isCurrent ? 'pg-tab pg-tab-active' : 'pg-tab'
      b.innerHTML = `<span class="tab-num">${tab.num}</span><span class="tab-label">${tab.label}</span>`
      b.addEventListener('click', () => goTo(tab.pageIndex))
      return b
    }

    function renderTabs() {
      bar!.innerHTML = ''
      const curRawId = pages[cur]?.id
      for (const tab of ALL_TABS) {
        const isCurrent = tab.kind === 'page' && tab.rawId === curRawId
        bar!.appendChild(makeTab(tab, isCurrent))
      }
    }

    function position(animate: boolean) {
      const W = vp!.offsetWidth
      pageEls.forEach((el, i) => {
        if (!el) return
        el.style.transition = animate
          ? `transform ${SLIDE}ms cubic-bezier(0.45,0,0.15,1), opacity ${SLIDE}ms ease`
          : 'none'
        if (i === cur) {
          el.style.transform = 'translateX(0)'; el.style.opacity = '1'
          el.style.zIndex = '10'; el.style.pointerEvents = ''
        } else if (i < cur) {
          el.style.transform = `translateX(${-W}px)`; el.style.opacity = '0'
          el.style.zIndex = '5'; el.style.pointerEvents = 'none'
        } else {
          el.style.transform = `translateX(${W}px)`; el.style.opacity = '0'
          el.style.zIndex = '5'; el.style.pointerEvents = 'none'
        }
      })
    }

    function goTo(pageIndex: number) {
      if (locked || pageIndex === cur) return
      locked = true; cur = pageIndex
      position(true); renderTabs()
      pageEls[cur]?.scrollTo(0, 0)
      window.dispatchEvent(new CustomEvent('gazette:pagechange', { detail: { pageId: pages[cur].id } }))
      setTimeout(() => { locked = false }, SLIDE + 40)
    }

    function onGoto(e: Event) {
      const targetId = (e as CustomEvent<{ pageId: string }>).detail?.pageId
      const targetIndex = pages.findIndex((p) => p.id === targetId)
      if (targetIndex !== -1) goTo(targetIndex)
    }
    window.addEventListener('gazette:goto', onGoto)

    position(false); renderTabs()
    window.dispatchEvent(new CustomEvent('gazette:pagechange', { detail: { pageId: pages[0]?.id } }))
    window.addEventListener('resize', () => position(false))

    return () => {
      window.removeEventListener('resize', () => position(false))
      window.removeEventListener('gazette:goto', onGoto)
    }
  }, [pages, navItems])

  return null
}
