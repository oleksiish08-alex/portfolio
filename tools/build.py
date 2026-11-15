#!/usr/bin/env python3
"""Static site generator for the portfolio (EN + UA).

Run from the repo root:  python3 tools/build.py

Why a generator? Every page exists as plain, fully translated HTML per language
(good for SEO, works without JS), while the markup, SEO tags and components
stay in ONE place. Edit copy in tools/content/*.json and rerun.
"""
import json, os, html
from os.path import relpath, join, dirname, abspath

ROOT = dirname(dirname(abspath(__file__)))
CONTENT = join(ROOT, 'tools', 'content')
BASE = 'https://oleksiish08-alex.github.io/portfolio/'
CALENDLY = 'https://calendly.com/oleksii-sh08/45min?back=1&amp;month=2026-10'
CV = 'https://drive.google.com/file/d/1DHAe34A5fS1lUD6Vkf6v7oPMSkAi_8Ew/view?usp=sharing'
SOCIAL = [('LinkedIn', 'https://www.linkedin.com/in/oleksii-shirokov-designer', 'linkedin'),
          ('Behance', 'https://behance.net/shirokov_alex', 'image'),
          ('Vimeo', 'https://vimeo.com/shirokovalex', 'video')]
LANGS = {
    'en': dict(prefix='', html='en', hreflang='en', locale='en_US', label='EN'),
    'ua': dict(prefix='ua/', html='uk', hreflang='uk', locale='uk_UA', label='UA'),
}
BEHANCE_FOOD = 'https://www.behance.net/gallery/131573945/UXUI-IOs-Food-delivery'
OG_HOME = 'ai-platform.png'


def load(name):
    with open(join(CONTENT, name), encoding='utf-8') as f:
        return json.load(f)


I18N = {}
for lg in LANGS:
    d = load(f'{lg}.base.json'); d.update(load(f'new_{lg}.json')); I18N[lg] = d


def esc(s):
    return html.escape(str(s), quote=True)


class Ctx:
    def __init__(self, lang, path):
        self.lang, self.path = lang, path            # path: site-relative dir, e.g. 'ua/projects/food-delivery/'
        self.up = '../' * path.count('/')            # prefix back to repo root
        self.d = I18N[lang]

    def t(self, k, **kw):
        s = self.d.get(k)
        if s is None:
            raise KeyError(f'[{self.lang}] missing i18n key: {k}')
        for a, b in kw.items():
            s = s.replace('{' + a + '}', b)
        return esc(s)

    def raw(self, k):
        return self.d[k]

    def rel_to(self, other_path):
        r = relpath(other_path or '.', self.path or '.')
        r = '' if r == '.' else r + '/'
        return r or './'

    @property
    def home(self):          # link from this page to this language's home
        return '' if self.path == LANGS[self.lang]['prefix'] else self.rel_to(LANGS[self.lang]['prefix'])


def ic(name, size=18, cls=''):
    c = f' class="{cls}"' if cls else ''
    return f'<animate-icons name="{name}" size="{size}"{c} is-animated="false" aria-hidden="true"></animate-icons>'


SUN = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>'
MOON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>'
ARROW = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 17 17 7M8 7h9v9"/></svg>'
AUG = 'data-aug="tl-clip br-clip border"'


# ------------------------------------------------------------------ HEAD / SEO
def head(c, title, desc, og_image, jsonld, alt_paths):
    cur = BASE + c.path
    alts = ''.join(f'  <link rel="alternate" hreflang="{LANGS[l]["hreflang"]}" href="{BASE + p}">\n' for l, p in alt_paths.items())
    alts += f'  <link rel="alternate" hreflang="x-default" href="{BASE + alt_paths["en"]}">\n'
    other = [l for l in LANGS if l != c.lang][0]
    return f'''<!DOCTYPE html>
<html lang="{LANGS[c.lang]['html']}" data-theme="classic" data-lang="{c.lang}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{esc(title)}</title>
  <meta name="description" content="{esc(desc)}">
  <link rel="canonical" href="{cur}">
{alts}  <meta property="og:type" content="website">
  <meta property="og:site_name" content="Oleksii Shirokov">
  <meta property="og:title" content="{esc(title)}">
  <meta property="og:description" content="{esc(desc)}">
  <meta property="og:url" content="{cur}">
  <meta property="og:image" content="{BASE}{og_image}">
  <meta property="og:locale" content="{LANGS[c.lang]['locale']}">
  <meta property="og:locale:alternate" content="{LANGS[other]['locale']}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="{esc(title)}">
  <meta name="twitter:description" content="{esc(desc)}">
  <meta name="twitter:image" content="{BASE}{og_image}">
  <link rel="icon" type="image/svg+xml" href="{c.up}favicon.svg?v=1">
  <script>(function(){{var r=document.documentElement;r.className+=' js';var t='classic';try{{var s=localStorage.getItem('theme');if(s==='classic'||s==='cyber'||s==='golden'){{t=s}}}}catch(e){{}}r.setAttribute('data-theme',t)}})();</script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Plus+Jakarta+Sans:wght@500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="{c.up}style.css">
  <link rel="stylesheet" href="https://unpkg.com/augmented-ui@2/augmented-ui.min.css">
  <script type="application/ld+json">{json.dumps(jsonld, ensure_ascii=False)}</script>
  <script defer src="https://cdn.jsdelivr.net/npm/@animateicons/vanilla/dist/cdn/lucide.js"></script>
  <script defer src="{c.up}js/site.js"></script>
  <script defer src="{c.up}js/effects.js"></script>
</head>
<body>
<a class="skip-link" href="#main">{c.t('skip_link')}</a>
'''


# ------------------------------------------------------------------ HEADER / FOOTER
def about_href(c):
    return c.rel_to(LANGS[c.lang]['prefix'] + 'about/')


def nav_href(c, i, h):
    return about_href(c) if i == 'about' else f'{h}#{i}'


def nav_items(c):
    h = c.home
    return [('projects', 'nav_projects'), ('achievements', 'nav_achievements'), ('approach', 'nav_approach'),
            ('skills', 'nav_skills'), ('services', 'nav_services'), ('contact', 'nav_contact')], h


def header(c, alt_paths):
    items, h = nav_items(c)
    other_page = {l: c.rel_to(p) for l, p in alt_paths.items()}
    dn = json.dumps({'cyber': c.raw('theme_cyber'), 'golden': c.raw('theme_golden')}, ensure_ascii=False)
    on_about = c.path.endswith('about/')
    cur = lambda i: ' aria-current="page"' if (i == 'about' and on_about) else ''
    dn_attr = lambda i: '' if i == 'about' else f' data-nav="{i}"'
    desk = ''.join(f'<a href="{nav_href(c, i, h)}"{dn_attr(i)}{cur(i)}>{c.t(k)}</a>' for i, k in items)
    mob = ''.join(f'<a href="{nav_href(c, i, h)}"{cur(i)}>{c.t(k)}</a>' for i, k in items)
    langs = ''.join(
        f'<a href="{other_page[l]}" data-base="{other_page[l]}" class="lang-btn" hreflang="{LANGS[l]["hreflang"]}" lang="{LANGS[l]["html"]}" '
        f'aria-pressed="{"true" if l == c.lang else "false"}"{" aria-current=\"page\"" if l == c.lang else ""}>{LANGS[l]["label"]}</a>'
        for l in ('en', 'ua'))
    return f'''<header class="site-header">
  <div class="wrap-wide site-header__row">
    <div class="brand">
      <a class="brand__mono" href="{h or './'}" aria-label="{c.t('home_logo_aria')}">OS</a>
      <a class="brand__text" href="{h or './'}#hero"><span class="brand__name">{c.t('f_name_s_name')}</span>
      <span class="brand__status"><span class="status-dot"></span>{c.t('status_available')}</span></a>
    </div>
    <nav class="nav-primary" aria-label="{c.t('nav_primary')}">{desk}</nav>
    <div class="header-tools">
      <div class="lang-switch" role="group" aria-label="{c.t('lang_group')}">{langs}</div>
      <div class="theme-seg" role="group" aria-label="{c.t('theme_group')}">
        <button type="button" class="theme-seg__btn" data-mode="light" aria-pressed="true" aria-label="{c.t('theme_light')}" title="{c.t('theme_light')}">{SUN}</button>
        <button type="button" class="theme-seg__btn" data-mode="dark" aria-pressed="false" aria-label="{c.t('theme_dark')}" title="{c.t('theme_dark')}">{MOON}</button>
      </div>
      <button type="button" id="palette-btn" class="palette-dot" data-names='{esc(dn)}' data-tpl="{esc(c.raw('theme_palette_to'))}" aria-label="" title=""><span></span></button>
      <a href="{h}#contact" class="btn btn-primary btn-small cta-desktop" {AUG}>{ic('message-square-text', 16)}<span>{c.t('nav_cta')}</span></a>
      <button type="button" id="burger-btn" class="btn btn-outline btn-small burger" aria-controls="mobile-menu" aria-expanded="false" aria-label="{c.t('nav_menu_open')}" data-open="{c.t('nav_menu_open')}" data-close="{c.t('nav_menu_close')}" {AUG}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg></button>
    </div>
  </div>
  <nav id="mobile-menu" class="mobile-menu" aria-label="{c.t('nav_primary')}">{mob}</nav>
</header>
'''


def footer(c):
    items, h = nav_items(c)
    links = [('hero', 'nav_home'), ('projects', 'nav_projects'), ('achievements', 'nav_achievements'),
             ('approach', 'nav_approach'), ('services', 'nav_services'), ('about', 'nav_about'), ('skills', 'nav_skills'), ('contact', 'nav_contact')]
    nav = ''.join(f'<a href="{nav_href(c, i, h)}">{c.t(k)}</a>' for i, k in links)
    soc = ''.join(f'<a href="{u}" target="_blank" rel="noopener noreferrer">{n}</a>' for n, u, _ in SOCIAL)
    return f'''<footer class="site-footer">
  <div class="wrap-wide">
    <div class="footer__grid">
      <div class="footer__brand"><a class="footer__logo" href="{about_href(c)}" aria-label="{c.t('about_logo_aria')}">OS</a><br><span class="brand__name font-display">{c.t('f_name_s_name')}</span><p class="muted">{c.t('footer_tagline')}</p><p class="muted">{c.t('location_line')}</p></div>
      <nav aria-label="{c.t('nav_footer')}"><p class="footer__h">{c.t('nav_footer')}</p><div class="footer__nav">{nav}</div></nav>
      <div><p class="footer__h">{c.t('footer_contact')}</p>
        <div class="footer__list"><a href="mailto:oleksii.sh08@gmail.com">oleksii.sh08@gmail.com</a>
        <a href="{CALENDLY}" target="_blank" rel="noopener noreferrer">{c.t('contact_book_time')}</a>{soc}
        <a href="https://t.me/OleksiiShirokovBot" target="_blank" rel="noopener noreferrer">Telegram · {c.t('tg_label')}</a></div></div>
    </div>
    <div class="footer__bottom"><span>{c.t('footer_copyright')}</span></div>
  </div>
</footer>
<div class="tg-fab"><a class="tg-fab__btn" {AUG} href="https://t.me/OleksiiShirokovBot" target="_blank" rel="noopener noreferrer" aria-label="{c.t('tg_aria')}">{ic('send', 20)}</a></div>
<button type="button" id="backToTop" class="btn-to-top" aria-label="{c.t('back_to_top')}" {AUG}>{ic('arrow-up', 22)}</button>
'''


# ------------------------------------------------------------------ HOME SECTIONS
PROJECTS = [  # n, image, url (None → internal case), metric keys, eager
    (1, 'ai-platform', 'https://www.figma.com/proto/Dnijerd9Y2sLNSndi3Zm1E?node-id=4104-253', ['project_1_metric'], True),
    (2, 'wellness', 'https://www.figma.com/proto/aeME9cIeidupiwlBQXGZsl?node-id=58-1645', ['project_2_metric'], True),
    (3, 'food-delivery', BEHANCE_FOOD, ['project_3_metric'], False),
    (4, 'logistics-crm', 'https://ship-smile-pro.lovable.app', ['project_4_metric_1', 'project_4_metric_2'], False),
    (5, 'wine-ecommerce', 'https://www.behance.net/gallery/157872965/E-Commerce-wine-sales', ['project_5_metric_1', 'project_5_metric_2'], False),
    (6, 'witcher-mythology', 'https://www.behance.net/gallery/186914447/Ukrainian-mythology-in-the-Witcher-games', ['project_6_metric_1', 'project_6_metric_2'], False),
]


def picture(c, name, alt, eager=False):
    d = c.up
    return (f'<picture><source media="(max-width: 767px)" srcset="{d}{name}-mob.webp" type="image/webp">'
            f'<source media="(max-width: 767px)" srcset="{d}{name}-mob.png">'
            f'<source srcset="{d}{name}.webp" type="image/webp">'
            f'<img src="{d}{name}.png" alt="{alt}" width="1280" height="720" '
            f'{"fetchpriority=\"high\"" if eager else "loading=\"lazy\" decoding=\"async\""}></picture>')


def project_card(c, n, img, url, metrics, eager):
    tags = ''.join(f'<li class="tag" {AUG}>{esc(x)}</li>' for x in c.raw(f'project_{n}_tag').split(' · '))
    mets = ''.join(f'<span>{c.t(m)}</span>' for m in metrics)
    return f'''<li class="fade-up"><article id="project-{n}" class="card_s pcard" {AUG}>
  <div class="img" {AUG.replace(' border', '')}>{picture(c, img, c.t(f"project_{n}_alt"), eager)}</div>
  <div class="pcard__body">
    <ul class="pcard__tags" aria-label="Tags">{tags}</ul>
    <h3 class="pcard__title"><a class="pcard__link" href="{url}" target="_blank" rel="noopener noreferrer">{c.t(f"project_{n}_title")}<span class="sr-only"> {c.t("project_external")}</span></a></h3>
    <p class="pcard__desc">{c.t(f"project_{n}_desc")}</p>
    <div class="pcard__foot"><div class="pcard__metrics">{mets}</div><span class="pcard__arrow">{ARROW}</span></div>
  </div></article></li>'''


def section_hero(c):
    return f'''<section id="hero" class="hero">
  <div class="wrap-wide">
    <div class="hero__grid">
      <div class="rise">
        <p class="tag" {AUG}>{c.t('hero_tag')}</p>
        <h1 class="hero__title" style="margin-top:16px">{c.t('hero_headline')}</h1>
        <p class="hero__sub muted">{c.t('hero_sub')}</p>
        <ul class="chips" aria-label="Focus"><li class="chip">{c.t('hero_chip_1')}</li><li class="chip">{c.t('hero_chip_2')}</li><li class="chip">{c.t('hero_chip_3')}</li></ul>
        <p class="hero__value muted">{c.t('hero_value')}</p>
        <div class="hero__actions">
          <a href="#projects" class="btn btn-primary" {AUG}>{ic('chevrons-down')}<span>{c.t('btn_explore')}</span></a>
          <a href="{CALENDLY}" target="_blank" rel="noopener noreferrer" class="btn btn-outline" {AUG}>{ic('calendar-check')}<span>{c.t('contact_book_time')}</span></a>
          <a href="{CV}" target="_blank" rel="noopener noreferrer" class="btn btn-outline" {AUG}>{ic('download')}<span>{c.t('btn_download_cv')}</span></a>
        </div>
      </div>
      <div class="hero__aside rise">
        <div class="photo-card"><div class="photo-frame" {AUG}>
          <picture><source srcset="{c.up}profile.webp" type="image/webp"><img src="{c.up}profile.png" alt="{c.t('f_name_s_name')}, Senior UI/UX &amp; Product Designer" class="photo-img" width="256" height="256" fetchpriority="high"></picture>
          <span class="photo-scan" aria-hidden="true"></span><span class="hud-corner tr" aria-hidden="true"></span><span class="hud-corner bl" aria-hidden="true"></span>
        </div></div>
        <div class="photo-badge-row"><span class="status-dot"></span><span class="text-sm" style="font-weight:500;color:var(--text-primary)">{c.t('photo_badge')}</span></div>
      </div>
    </div>
  </div>
</section>
'''


def highlights(c):
    return f'''<div class="card card-contrast hero__highlights fade-up" {AUG}>
      <p class="font-display" style="grid-column:1/-1;font-size:.85rem;font-weight:600;letter-spacing:.06em;color:var(--text-accent-c)">{c.t('highlights_label')}</p>
      <div class="hl" data-icon-host>{ic('landmark', 18, 'hl-icon')}<span>{c.t('highlight_1')}</span></div>
      <div class="hl" data-icon-host>{ic('sparkles', 18, 'hl-icon')}<span>{c.t('highlight_2')}</span></div>
      <div class="hl" data-icon-host>{ic('badge-check', 18, 'hl-icon')}<span>{c.t('highlight_3')}</span></div>
      <p class="hero__loc">{c.t('location_line')}</p>
    </div>'''


def section_projects(c):
    cards = ''.join(project_card(c, *p) for p in PROJECTS)
    return f'''<section id="projects" class="projects">
  <div class="wrap-wide">
    <div class="sec-head fade-up"><p class="tag" {AUG}>{c.t('projects_tag')}</p><h2 class="h2">{c.t('projects_title')}</h2><p class="lead">{c.t('projects_sub')}</p></div>
    <ul class="pgrid">{cards}</ul>
    {highlights(c)}
  </div>
</section>
'''


def section_metrics(c):
    data = [('24', '-', '%', 'impact_1', '#project-1', None), ('16', '-', '%', 'impact_2', '#project-3', None),
            ('34', '+', '%', 'impact_3', '#project-4', None), ('7', '', '+', 'impact_4', about_href(c), 'impact_4_unit')]
    cards = ''
    for i, (n, pre, suf, key, link, unit) in enumerate(data, 1):
        final = f'{pre}{n}{suf}'
        u = f'<small>{c.t(unit)}</small>' if unit else ''
        cards += f'''<li class="mcard fade-up"><span class="mcard__idx">0{i}</span>
  <p class="mcard__num" role="text" aria-label="{final} {c.t(unit) if unit else ''}"><span aria-hidden="true" data-count="{n}" data-prefix="{pre}" data-suffix="{suf}">{final}</span>{u}</p>
  <span class="mcard__bar" aria-hidden="true"></span><p class="mcard__desc">{c.t(key)}</p>
  <a class="mcard__link" href="{link}">{c.t('metrics_about') if unit else c.t('metrics_see')} →</a></li>'''
    return f'''<section id="achievements" class="metrics">
  <span id="impact" class="anchor"></span>
  <div class="wrap-wide" style="position:relative">
    <div class="sec-head fade-up"><p class="tag" {AUG}>{c.t('metrics_tag')}</p><h2 class="h2">{c.t('metrics_title')}</h2><p class="lead" style="color:var(--text-secondary-c)">{c.t('metrics_sub')}</p></div>
    <ul class="mgrid">{cards}</ul>
  </div>
</section>
'''


STEP_ICONS = ['search', 'compass', 'layers', 'layout-grid', 'code-xml']


def section_approach(c):
    tabs = panels = ''
    for i in range(1, 6):
        tabs += (f'<button type="button" role="tab" class="step" id="step-tab-{i}" aria-controls="step-panel-{i}" data-tab-id="step-{i}">'
                 f'<span class="step__node">{ic(STEP_ICONS[i-1], 20)}</span><span class="step__label">{c.t(f"approach_step_{i}")}</span></button>')
        panels += (f'<div role="tabpanel" class="step__panel card" id="step-panel-{i}" aria-labelledby="step-tab-{i}" tabindex="0" {AUG} hidden>'
                   f'<h3 class="h3">{i}. {c.t(f"approach_step_{i}")}</h3><p>{c.t(f"approach_step_{i}_desc")}</p>'
                   f'<div class="step__nav"><button type="button" class="btn btn-outline step__btn" data-tab-go="prev" aria-label="{c.t("approach_prev")}" title="{c.t("approach_prev")}" {AUG}><span aria-hidden="true">&lt;</span></button>'
                   f'<button type="button" class="btn btn-outline step__btn" data-tab-go="next" aria-label="{c.t("approach_next")}" title="{c.t("approach_next")}" {AUG}><span aria-hidden="true">&gt;</span></button></div></div>')
    pr = [('code-xml', 1), ('layout-grid', 2), ('user-check', 3)]
    pcells = ''.join(f'<div class="pcell card fade-up" data-icon-host {AUG}><span class="pcell__icon">{ic(n, 20)}</span><div><h3 class="h3" style="font-size:1rem">{c.t(f"systems_{k}_title")}</h3><p class="muted" style="font-size:.9rem;margin-top:4px">{c.t(f"systems_{k}_desc")}</p></div></div>' for n, k in pr)
    helps = [('globe', 1), ('trending-up', 2), ('search', 3), ('lightbulb', 4)]
    hcards = ''.join(f'<div class="card fade-up" data-icon-host {AUG}><span class="icon-chip" style="margin-bottom:16px">{ic(n, 20)}</span><h3 class="h3" style="font-size:1rem">{c.t(f"help_{k}_title")}</h3><p class="muted" style="font-size:.9rem;margin-top:8px">{c.t(f"help_{k}_desc")}</p></div>' for n, k in helps)
    return f'''<section id="approach">
  <span id="systems" class="anchor"></span>
  <div class="wrap-wide">
    <div class="sec-head fade-up"><p class="tag" {AUG}>{c.t('systems_tag')}</p><h2 class="h2">{c.t('systems_title')}</h2><p class="lead">{c.t('systems_desc')}</p></div>
    <div class="fade-up">
      <h3 class="h3" style="margin-bottom:8px">{c.t('approach_title')}</h3><p class="muted">{c.t('approach_sub')}</p>
      <div class="steps" data-tabs data-progress>
        <div class="steps__scroll"><div class="steps__list" role="tablist" aria-label="{c.t('approach_steps_label')}">{tabs}</div></div>
        {panels}
        <p class="wcag-band">{ic('badge-check', 20, 'icon-accent')}<span>{c.t('approach_wcag')}</span></p>
      </div>
    </div>
    <p class="principles__title">{c.t('approach_principles')}</p>
    <div class="principles" style="margin-top:16px">{pcells}</div>
    <span id="help" class="anchor"></span>
    <h3 class="h3" style="margin-top:56px">{c.t('help_title')}</h3>
    <div class="help-grid">{hcards}</div>
  </div>
</section>
'''


def section_skills(c):
    def pills(items):
        return '<ul class="pills">' + ''.join(f'<li class="pill">{i}</li>' for i in items) + '</ul>'
    T = c.t
    cats = [
        ('compass', T('skills_cat_1'), pills([T(f'skills_cat_1_{i}') for i in range(1, 6)])),
        ('layers', T('skills_cat_2'), pills([T('skills_cat_2_1'), T('skills_cat_2_2'), 'iOS Human Interface Guidelines', 'Material Design'])),
        ('user-check', T('skills_cat_3'), pills([T(f'skills_cat_3_{i}') for i in range(1, 5)])),
        ('clapperboard', T('skills_cat_4'), pills(['After Effects', 'Adobe Premiere Pro', 'Media Encoder', 'Photoshop'])),
        ('graduation-cap', T('skills_cat_5'), f'<p class="muted" style="margin-top:16px;font-size:.9rem">{T("skills_cat_5_desc")}</p><p class="muted" style="margin-top:8px;font-size:.9rem">{T("skills_cat_5_extra")}</p>'),
        ('badge-check', T('skills_cat_6'), pills([T(f'skills_cat_6_{i}') for i in range(1, 4)])),
    ]
    cards = ''.join(f'<li class="fade-up"><div class="card scard" data-icon-host {AUG} style="height:100%"><h3 class="scard__head">{ic(n, 20, "icon-accent")}<span>{t}</span></h3>{b}</div></li>' for n, t, b in cats)
    return f'''<section id="skills">
  <div class="wrap-wide">
    <div class="sec-head fade-up"><p class="tag" {AUG}>{T('skills_tag')}</p><h2 class="h2">{T('skills_title')}</h2></div>
    <ul class="sgrid">{cards}</ul>
    <div class="langs fade-up"><h3 class="h3">{T('lang_skills_m')}</h3>
      <div><strong>{T('lang_ukrainian')}</strong>{T('lang_ukrainian_level')}</div>
      <div><strong>{T('lang_english')}</strong>{T('lang_english_level')}</div></div>
  </div>
</section>
'''


def section_about(c):
    T = c.t
    dates = ['Jun 2025 – Aug 2025', 'Apr 2021 – Apr 2022', 'May 2014 – Present', 'Jan 2013 – Apr 2014']
    items = ''.join(f'<li class="timeline-item"><p class="timeline__date">{d}</p><h3>{T(f"exp_{i}_role")}</h3><p class="muted">{T(f"exp_{i}_desc")}</p></li>' for i, d in enumerate(dates, 1))
    return f'''<section id="about">
  <span id="experience" class="anchor"></span>
  <div class="wrap-wide about__grid">
    <div class="fade-up"><p class="tag" {AUG}>{T('about_tag')}</p><h2 class="h2" style="margin-top:16px;max-width:12ch">{T('experience_title')}</h2><p class="lead" style="margin-top:12px">{T('experience_sub')}</p><a class="link-more" href="{about_href(c)}">{T('about_more')} →</a></div>
    <ol class="timeline fade-up">{items}</ol>
  </div>
</section>
'''


def contact_visual():
    """Decorative theme visuals: CSS shows exactly one per theme, js/effects.js renders only the visible one."""
    return ('<div class="contact__visual" aria-hidden="true">'
            '<div class="cv cv--earth"><canvas data-fx="earth" tabindex="-1"></canvas></div>'
            '<div class="cv cv--mesh"><canvas data-fx="mesh" tabindex="-1"></canvas></div>'
            '<div class="cv cv--ring"><canvas data-fx="ring" tabindex="-1"></canvas></div></div>')


def section_contact(c):
    T = c.t
    svc = [(1, 'users', 'service_1_title', 'service_1_desc'), (3, 'clipboard-check', 'service_3_title', 'service_3_desc'), (2, 'layout-dashboard', 'service_2_title', 'service_2_desc')]
    acc = ''.join(f'''<div class="accordion card fade-up" {AUG}><h3 style="margin:0"><button type="button" class="accordion-trigger" style="width:100%;display:flex;align-items:center;justify-content:space-between;gap:16px;text-align:left" aria-expanded="false" aria-controls="acc-body-{n}" id="acc-trigger-{n}">
<span class="acc-title">{ic(i, 20, "icon-accent")}<span>{T(t)}</span></span><span class="accordion-icon" style="color:var(--text-accent)"><span class="bar bar-h"></span><span class="bar bar-v"></span></span></button></h3>
<div class="accordion-body" id="acc-body-{n}" role="region" aria-labelledby="acc-trigger-{n}"><p class="muted">{T(d)}</p></div>
<div class="accordion-foot"><a href="{CALENDLY}" target="_blank" rel="noopener noreferrer" class="btn btn-outline" {AUG}>{ic("calendar-check")}<span>{T("btn_book_now")}</span></a></div></div>''' for n, i, t, d in svc)
    soc = ''.join(f'<a href="{u}" target="_blank" rel="noopener noreferrer" class="btn btn-outline" {AUG}>{ic(i)}<span>{n}</span></a>' for n, u, i in SOCIAL)
    return f'''<section id="services" style="padding-bottom:0">
  <div class="wrap-wide">
    <div class="sec-head fade-up"><p class="tag" {AUG}>{T('services_tag')}</p><h2 class="h2">{T('services_title')}</h2></div>
    <div class="services">{acc}</div>
  </div>
</section>
<section id="contact" style="padding-top:0">
  <div class="wrap-wide">
    <div class="card card-contrast contact__card has-visual fade-up" {AUG}>
      <div class="contact__body">
        <p class="tag" style="margin-bottom:20px;background:transparent;border-color:var(--border-c)" {AUG}>{T('contact_tag')}</p>
        <h2>{T('contact_title')}</h2><p style="color:var(--text-secondary-c)">{T('contact_sub')}</p>
        <div class="btn-row"><a href="mailto:oleksii.sh08@gmail.com" class="btn btn-primary" {AUG}>{ic('mail-open')}<span>{T('contact_email_btn')}</span></a>
        <a href="{CALENDLY}" target="_blank" rel="noopener noreferrer" class="btn btn-ghost-c" {AUG}>{ic('calendar-check')}<span>{T('contact_book_time')}</span></a></div>
      </div>
      {contact_visual()}
    </div>
    <div class="social-row social-links fade-up">{soc}</div>
  </div>
</section>
'''


# ------------------------------------------------------------------ PAGES
def home_page(lang):
    c = Ctx(lang, LANGS[lang]['prefix'])
    alt = {l: LANGS[l]['prefix'] for l in LANGS}
    ld = {'@context': 'https://schema.org', '@graph': [
        {'@type': 'Person', 'name': c.raw('f_name_s_name'), 'url': BASE + c.path, 'image': BASE + 'profile.png',
         'jobTitle': 'Senior UI/UX & Product Designer', 'inLanguage': LANGS[lang]['html'],
         'sameAs': [u for _, u, _ in SOCIAL]},
        {'@type': 'WebSite', 'name': c.raw('f_name_s_name'), 'url': BASE + c.path, 'inLanguage': LANGS[lang]['html']}]}
    out = head(c, c.raw('meta_title'), c.raw('meta_desc_home'), OG_HOME, ld, alt)
    out += header(c, alt) + '<main id="main">\n' + ''.join(f(c) for f in (
        section_hero, section_projects, section_metrics, section_approach, section_skills, section_about, section_contact)) + '</main>\n'
    out += footer(c) + '</body>\n</html>\n'
    return c.path, out


def rotator(texts):
    """Fade-in text rotator (js/site.js [data-rotator]). All texts live in the DOM so the box is as tall as the longest one (no layout shift);
    only the first is exposed to assistive tech until the script swaps them."""
    items = ''
    for n, t in enumerate(texts):
        words = ''.join(f'<span class="w" style="--i:{i}">{esc(w)}</span> ' for i, w in enumerate(t.split()))
        hid = '' if n == 0 else ' aria-hidden="true"'
        items += f'<span class="rotator__item{" is-active" if n == 0 else ""}"{hid}>{words}</span>'
    return f'<h2 class="rotator" data-rotator data-interval="16000">{items}</h2>'


def about_page(lang):
    """About page — all copy comes from tools/content/about.json (taken from the CV)."""
    c = Ctx(lang, f'{LANGS[lang]["prefix"]}about/')
    alt = {l: f'{LANGS[l]["prefix"]}about/' for l in LANGS}
    T = c.t
    A = load('about.json')[lang]
    ld = {'@context': 'https://schema.org', '@type': 'ProfilePage', 'inLanguage': LANGS[lang]['html'], 'url': BASE + c.path,
          'mainEntity': {'@type': 'Person', 'name': c.raw('f_name_s_name'), 'image': BASE + 'profile.png',
                         'jobTitle': 'UI/UX Designer', 'knowsLanguage': ['uk', 'en'],
                         'homeLocation': {'@type': 'Place', 'name': 'Lviv, Ukraine'},
                         'alumniOf': {'@type': 'CollegeOrUniversity', 'name': 'Dnipro University of Technology'},
                         'email': 'oleksii.sh08@gmail.com', 'sameAs': [u for _, u, _ in SOCIAL]}}
    out = head(c, c.raw('meta_title_about'), c.raw('meta_desc_about'), 'profile.png', ld, alt)
    out += header(c, alt) + '<main id="main">\n'
    pills = lambda items: '<ul class="pills">' + ''.join(f'<li class="pill">{esc(i)}</li>' for i in items) + '</ul>'
    facts = ''.join(f'<div><dt>{esc(k)}</dt><dd>{esc(v)}</dd></div>' for k, v in A['facts'])
    focus = ''.join(f'<li class="chip">{esc(x)}</li>' for x in A['focus'])
    links = ''.join(f'<a href="{u}" target="_blank" rel="noopener noreferrer" class="btn btn-ghost-c btn-small" {AUG}>{ic(i, 16)}<span>{n}</span><span class="sr-only"> {c.t("project_external")}</span></a>' for n, u, i in SOCIAL)
    values = ''.join(f'<div class="card fade-up" {AUG}><span class="value__n">0{i}</span><h3 class="h3">{esc(t)}</h3><p class="muted">{esc(d)}</p></div>' for i, (t, d) in enumerate(A['value'], 1))
    out += f"""<section class="about-hero"><div class="wrap-wide">
  <div class="about-hero__grid">
    <div class="photo-card rise"><div class="photo-frame" {AUG}>
      <picture><source srcset="{c.up}profile.webp" type="image/webp"><img src="{c.up}profile.png" alt="{T('f_name_s_name')}" class="photo-img" width="256" height="256" fetchpriority="high"></picture>
      <span class="photo-scan" aria-hidden="true"></span><span class="hud-corner tr" aria-hidden="true"></span><span class="hud-corner bl" aria-hidden="true"></span></div></div>
    <div class="rise"><p class="tag" {AUG}>{T('about_tag')} · {esc(A['role'])}</p><h1 class="about-title">{esc(A['title'])}</h1>
      <ul class="chips" aria-label="Focus">{focus}</ul>
      <p class="lead" style="margin-top:20px">{esc(A['summary'])}</p>
      <div class="hero__actions"><a href="mailto:oleksii.sh08@gmail.com" class="btn btn-primary" {AUG}>{ic('mail-open')}<span>{T('contact_email_btn')}</span></a>
      <a href="{CV}" target="_blank" rel="noopener noreferrer" class="btn btn-outline" {AUG}>{ic('download')}<span>{T('btn_download_cv')}</span></a></div></div>
  </div>
  <dl class="about-facts">{facts}</dl>
</div></section>
<section style="padding-top:0"><div class="wrap-wide"><div class="sec-head fade-up"><h2 class="h2">{esc(A['value_h'])}</h2></div>
  <div class="value-grid">{values}</div></div></section>
"""
    L = A['lbl']
    xps = ''
    for x in A['xp']:
        projs = ''
        for pr in x['projects']:
            projs += (f'<div class="xp__proj"><h4>{esc(pr["name"])}</h4><dl class="xp__rows">'
                      f'<div><dt>{esc(L["goal"])}</dt><dd>{esc(pr["goal"])}</dd></div>'
                      f'<div><dt>{esc(L["impact"])}</dt><dd>{esc(pr["impact"])}</dd></div>'
                      f'<div class="xp__res"><dt>{esc(L["result"])}</dt><dd>{esc(pr["result"])}</dd></div></dl></div>')
        xps += (f'<article class="xp card fade-up" {AUG}><header class="xp__head"><div><h3 class="h3">{esc(x["role"])}</h3>'
                f'<p class="muted">{esc(x["org"])}</p></div><p class="timeline__date">{esc(x["date"])}</p></header>{projs}</article>')
    out += f'<section style="padding-top:0"><div class="wrap-wide"><div class="sec-head fade-up"><h2 class="h2">{esc(A["exp_h"])}</h2></div><div class="xp-list">{xps}</div></div></section>\n'
    card = lambda t, items: f'<div class="card fade-up" {AUG}><h3 class="scard__head">{esc(t)}</h3>{pills(items)}</div>'
    sk = ''.join(card(t, i) for t, i in A['skills'])
    tl = ''.join(card(t, i) for t, i in A['tools'])
    e = A['edu']
    langs = ''.join(f'<li><strong>{esc(n)}</strong><span class="muted">{esc(v)}</span></li>' for n, v in A['langs'])
    out += f"""<section style="padding-top:0"><div class="wrap-wide"><div class="sec-head fade-up"><h2 class="h2">{esc(A['skills_h'])}</h2></div>
  <div class="help-grid about-skills">{sk}</div>
  <h3 class="h3" style="margin:40px 0 16px">{esc(A['tools_h'])}</h3><div class="help-grid about-skills about-skills--2">{tl}</div></div></section>
<section style="padding-top:0"><div class="wrap-wide about-trio">
  <div class="card fade-up" {AUG}><h3 class="scard__head">{esc(A['edu_h'])}</h3><p style="margin-top:12px;color:var(--text-primary);font-weight:600">{esc(e[0])}</p><p class="muted">{esc(e[1])}</p><p class="muted" style="margin-top:6px;font-size:.9rem">{esc(e[2])}</p><p class="muted" style="margin-top:6px;font-size:.9rem">{esc(e[3])}</p></div>
  <div class="card fade-up" {AUG}><h3 class="scard__head">{esc(A['cert_h'])}</h3>{pills(A['certs'])}</div>
  <div class="card fade-up" {AUG}><h3 class="scard__head">{esc(A['lang_h'])}</h3><ul class="lang-list">{langs}</ul></div>
</div></section>
<section style="padding-top:0"><div class="wrap-wide"><div class="card card-contrast contact__card has-visual fade-up" {AUG}>
  <div class="contact__body">
  {rotator(A['cta_rotate'])}<p style="color:var(--text-secondary-c)">{T('contact_sub')}</p>
  <div class="btn-row"><a href="mailto:oleksii.sh08@gmail.com" class="btn btn-primary" {AUG}>{ic('mail-open')}<span>{T('contact_email_btn')}</span></a>
  <a href="{CALENDLY}" target="_blank" rel="noopener noreferrer" class="btn btn-ghost-c" {AUG}>{ic('calendar-check')}<span>{T('contact_book_time')}</span></a></div>
  <p style="margin:24px auto 8px;text-align:center;max-width:none;font-size:.8rem;letter-spacing:.06em;text-transform:uppercase;color:var(--text-secondary-c)">{esc(A['links_h'])}</p><div class="btn-row social-links" style="margin-top:0">{links}</div></div>
  {contact_visual()}
</div></div></section>
</main>
"""
    out += footer(c) + '</body>\n</html>\n'
    return c.path, out


def write(path, text):
    full = join(ROOT, path, 'index.html') if not path.endswith('.xml') and not path.endswith('.txt') else join(ROOT, path)
    os.makedirs(dirname(full), exist_ok=True)
    with open(full, 'w', encoding='utf-8') as f:
        f.write(text)
    print('wrote', relpath(full, ROOT))


def sitemap(pages):
    rows = ''
    groups = [[LANGS[l]['prefix'] for l in LANGS], [f'{LANGS[l]["prefix"]}about/' for l in LANGS]]
    for g in groups:
        for p in g:
            alts = ''.join(f'\n    <xhtml:link rel="alternate" hreflang="{LANGS[l]["hreflang"]}" href="{BASE}{q}"/>' for l, q in zip(LANGS, g))
            alts += f'\n    <xhtml:link rel="alternate" hreflang="x-default" href="{BASE}{g[0]}"/>'
            rows += f'  <url>\n    <loc>{BASE}{p}</loc>{alts}\n  </url>\n'
    return ('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" '
            'xmlns:xhtml="http://www.w3.org/1999/xhtml">\n' + rows + '</urlset>\n')


if __name__ == '__main__':
    pages = []
    for lg in LANGS:
        pages.append(home_page(lg))
        pages.append(about_page(lg))
    for p, t in pages:
        write(p, t)
    write('sitemap.xml', sitemap(pages))
    write('robots.txt', f'User-agent: *\nAllow: /\n\nSitemap: {BASE}sitemap.xml\n')
