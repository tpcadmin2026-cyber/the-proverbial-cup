'use client'

import { useEffect } from 'react'
import type { NavItem } from '@prisma/client'

interface Page { id: string; tabNumeral: string; tabLabel: string; pageOrder: number }

interface Props {
  pages: Page[]
  navItems: NavItem[]
}

export function VictorianNav({ pages, navItems }: Props) {
  useEffect(() => {
    // Build a merged, sorted list of all tabs
    // Pages slide the viewport; nav items navigate to a URL
    type PageTab = { kind: 'page'; id: string; num: string; label: string; pageIndex: number; order: number }
    type LinkTab = { kind: 'link'; id: string; num: string; label: string; href: string; openInNewTab: boolean; order: number }
    type Tab = PageTab | LinkTab

    const pageTabs: PageTab[] = pages.map((p, i) => ({
      kind: 'page', id: `page-${p.id}`, num: p.tabNumeral, label: p.tabLabel,
      pageIndex: i, order: p.pageOrder,
    }))

    const linkTabs: LinkTab[] = navItems.map((n) => ({
      kind: 'link', id: `nav-${n.id}`, num: n.numeral, label: n.label,
      href: n.href, openInNewTab: n.openInNewTab, order: n.navOrder,
    }))

    const ALL_TABS: Tab[] = [...pageTabs, ...linkTabs].sort((a, b) => a.order - b.order)

    const SLIDE = 500
    let cur = 0 // index into pageTabs (NOT allTabs)
    let locked = false

    const pageEls = pages.map((p) => document.getElementById(`page-${p.id}`))
    const tabsL   = document.getElementById('tabs-left')
    const tabsR   = document.getElementById('tabs-right')
    const vp      = document.getElementById('viewport')

    if (!tabsL || !tabsR || !vp) return

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
      tabsL!.innerHTML = ''; tabsR!.innerHTML = ''

      // Current page tab — find it in ALL_TABS to know its position
      const curTab = pageTabs[cur]
      const curGlobalIdx = ALL_TABS.findIndex((t) => t.id === curTab?.id)

      // Left rail: everything before the current page tab in global order
      const leftTabs = ALL_TABS.slice(0, curGlobalIdx).reverse()
      // Right rail: everything after the current page tab in global order
      const rightTabs = ALL_TABS.slice(curGlobalIdx + 1)

      for (const tab of leftTabs)  tabsL!.appendChild(makeTab(tab, false))
      for (const tab of rightTabs) tabsR!.appendChild(makeTab(tab, false))

      tabsL!.style.width = leftTabs.length  > 0 ? '' : '14px'
      tabsR!.style.width = rightTabs.length > 0 ? '' : '14px'

      // If only one page, show an active tab so the user can see which page they're on
      if (pages.length === 1 && navItems.length === 0) {
        const b = document.createElement('div')
        b.className = 'pg-tab pg-tab-active'
        b.innerHTML = `<span class="tab-num">${pageTabs[0].num}</span><span class="tab-label">${pageTabs[0].label}</span>`
        tabsR!.style.width = ''
        tabsR!.appendChild(b)
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
      window.dispatchEvent(new CustomEvent('gazette:pagechange', { detail: { pageId: pageTabs[cur].id } }))
      setTimeout(() => { locked = false }, SLIDE + 40)
    }

    function onGoto(e: Event) {
      const targetId = (e as CustomEvent<{ pageId: string }>).detail?.pageId
      const tab = pageTabs.find((t) => t.id === targetId)
      if (tab) goTo(tab.pageIndex)
    }
    window.addEventListener('gazette:goto', onGoto)

    position(false); renderTabs()
    window.dispatchEvent(new CustomEvent('gazette:pagechange', { detail: { pageId: pageTabs[0]?.id } }))
    window.addEventListener('resize', () => position(false))

    return () => {
      window.removeEventListener('resize', () => position(false))
      window.removeEventListener('gazette:goto', onGoto)
    }
  }, [pages, navItems])

  return null
}
