(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[708],{1274:(e,a,n)=>{(window.__NEXT_P=window.__NEXT_P||[]).push(["/[locale]/404",function(){return n(8054)}])},4421:e=>{"use strict";e.exports={debug:!1,i18n:{defaultLocale:"en",locales:["en","tr"]},localePath:"/locales",reloadOnPrerender:!1}},8415:(e,a,n)=>{"use strict";n.d(a,{Z:()=>_});var s=n(5893),c=n(3814),t=n(7375),l=n(4593),r=n(5675),o=n.n(r),i=n(270),m=n(4622),d=n(7749),h=n(1163),x=n(848),u=n(4421),j=n.n(u),p=n(7191);n(7294);var g=n(6720);let f=e=>{let{locale:a,href:n}=e,c=(0,h.useRouter)(),t=n||c.asPath,l=c.pathname;return Object.keys(c.query).forEach(e=>{if("locale"===e){l=l.replace("[".concat(e,"]"),a);return}l=l.replace("[".concat(e,"]"),String(c.query[e]))}),a&&(t=n?"/".concat(a).concat(n):l),t.startsWith("/".concat(a))||(t="/".concat(a).concat(t)),(0,s.jsx)(g.Z,{variant:"link",size:"sm",className:"button-link",onClick:()=>{var e;null===(e=p.Z.cache)||void 0===e||e.call(p.Z,a),c.push(t)},children:a.toUpperCase()})};var N=n(7814);let b=()=>{let{t:e}=(0,m.$G)("common"),a=(0,h.useRouter)().query.locale||j().i18n.defaultLocale;return(0,s.jsx)(x.Z,{title:(0,s.jsxs)("span",{children:[(0,s.jsx)(N.G,{icon:"globe",className:"me-2"}),e("common.language")]}),id:"language-selector",children:j().i18n.locales.filter(e=>e!==a).map(e=>(0,s.jsx)(x.Z.Item,{children:(0,s.jsx)(f,{locale:e})},e))})};var Z=n(3391),v=n(517);let k=()=>{let{t:e}=(0,m.$G)("common"),a=(0,v.TL)(),n=(0,v.CG)(e=>e.theme.theme);return(0,s.jsxs)("button",{className:"btn theme-toggle-btn d-flex align-items-center gap-2 ".concat(n),onClick:()=>a((0,Z.X8)()),"aria-label":e("common.header.themeToggle"),children:[(0,s.jsx)(N.G,{icon:"light"===n?"moon":"sun"}),(0,s.jsx)("span",{children:e("common.header.theme.".concat(n))})]})};function y(){let{t:e}=(0,m.$G)("common");return(0,s.jsx)(c.Z,{expand:"lg",className:"shadow-sm",children:(0,s.jsxs)(t.Z,{children:[(0,s.jsxs)(c.Z.Brand,{as:d.Z,href:"/",className:"d-flex align-items-center link",children:[(0,s.jsx)(o(),{src:"".concat(i.Vc,"/images/logo.png"),alt:e("common.header.logoAlt"),width:40,height:40,priority:!0,className:"rounded-circle"}),(0,s.jsx)("span",{className:"ms-2 fw-bold",style:{fontSize:"1.25rem"},children:e("common.header.title")})]}),(0,s.jsx)(c.Z.Toggle,{"aria-controls":"navbar-nav",children:(0,s.jsx)(N.G,{icon:"bars",className:"navbar-toggler-icon"})}),(0,s.jsx)(c.Z.Collapse,{id:"navbar-nav",children:(0,s.jsxs)(l.Z,{className:"ms-auto d-flex gap-3 align-items-center",children:[(0,s.jsxs)(l.Z.Link,{as:d.Z,href:"/",children:[(0,s.jsx)(N.G,{icon:"home",className:"me-2"}),e("common.header.menu.home")]}),(0,s.jsxs)(l.Z.Link,{as:d.Z,href:"/about",children:[(0,s.jsx)(N.G,{icon:"info-circle",className:"me-2"}),e("common.header.menu.about")]}),(0,s.jsxs)(l.Z.Link,{as:d.Z,href:"/contact",children:[(0,s.jsx)(N.G,{icon:"address-book",className:"me-2"}),e("common.header.menu.contact")]}),(0,s.jsx)(b,{}),(0,s.jsx)(k,{})]})})]})})}function G(){let{t:e}=(0,m.$G)("common"),a=new Date().getFullYear();return(0,s.jsx)("footer",{className:"footer py-3",children:(0,s.jsx)(t.Z,{children:(0,s.jsx)("p",{className:"text-center mb-0",children:e("common.footer.text",{year:a})})})})}function _(e){let{children:a}=e;return(0,s.jsxs)(s.Fragment,{children:[(0,s.jsx)(y,{}),(0,s.jsx)("main",{children:(0,s.jsx)(t.Z,{className:"py-5",children:a})}),(0,s.jsx)(G,{})]})}},7749:(e,a,n)=>{"use strict";n.d(a,{Z:()=>r});var s=n(5893);n(7294);var c=n(1664),t=n.n(c),l=n(1163);let r=e=>{let{children:a,skipLocaleHandling:n=!1,href:c,locale:r,className:o,onClick:i,...m}=e,d=(0,l.useRouter)(),h=r||d.query.locale||"",x=c||d.asPath;x.startsWith("http")&&(n=!0),h&&!n&&(x=x?"/".concat(h).concat(x):d.pathname.replace("[locale]",h));let u="link",j=o?"".concat(u," ").concat(o):u;return(0,s.jsx)(t(),{href:x,...m,legacyBehavior:!0,children:(0,s.jsx)("a",{className:j,onClick:e=>{i&&i(e)},children:a})})}},7191:(e,a,n)=>{"use strict";n.d(a,{Z:()=>l});var s=n(1255),c=n(4421),t=n.n(c);let l=(0,s.Z)({fallbackLng:t().i18n.defaultLocale,supportedLngs:t().i18n.locales})},8054:(e,a,n)=>{"use strict";n.r(a),n.d(a,{__N_SSG:()=>d,default:()=>h});var s=n(5893),c=n(7375);n(7294);var t=n(9008),l=n.n(t),r=n(4622),o=n(7749),i=n(7814),m=n(8415),d=!0;function h(){let{t:e}=(0,r.$G)("404");return(0,s.jsxs)(m.Z,{children:[(0,s.jsxs)(l(),{children:[(0,s.jsx)("title",{children:e("404.title")}),(0,s.jsx)("meta",{name:"description",content:e("404.meta.description")}),(0,s.jsx)("meta",{name:"robots",content:"noindex, nofollow"})]}),(0,s.jsxs)(c.Z,{className:"text-center py-5",style:{maxWidth:"600px"},children:[(0,s.jsxs)("h1",{className:"display-1 fw-bold text-danger",children:[(0,s.jsx)(i.G,{icon:"exclamation-triangle",className:"me-2"}),e("404.errorCode")]}),(0,s.jsx)("h2",{className:"mb-4",children:e("404.header")}),(0,s.jsx)("p",{className:"fs-5 text-muted mb-4",children:e("404.description")}),(0,s.jsxs)(o.Z,{href:"/",className:"btn btn-primary px-4",children:[(0,s.jsx)(i.G,{icon:"home",className:"me-2"}),e("404.backToHome")]})]})]})}}},e=>{var a=a=>e(e.s=a);e.O(0,[532,888,774,179],()=>a(1274)),_N_E=e.O()}]);