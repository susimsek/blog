(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[721],{815:(e,a,n)=>{(window.__NEXT_P=window.__NEXT_P||[]).push(["/[locale]/about",function(){return n(5316)}])},4421:e=>{"use strict";e.exports={debug:!1,i18n:{defaultLocale:"en",locales:["en","tr"]},localePath:"/locales",reloadOnPrerender:!1}},3525:(e,a,n)=>{"use strict";n.d(a,{Z:()=>G});var s=n(5893),t=n(3814),l=n(7375),r=n(4593),c=n(5675),o=n.n(c),i=n(270),m=n(4622),d=n(3205),h=n(1163),x=n(9580),u=n(4421),j=n.n(u),f=n(7191),b=n(1664),g=n.n(b),p=n(6720);n(7294);let N=e=>{let{locale:a,href:n,...t}=e,l=(0,h.useRouter)(),r=n||l.asPath,c=l.pathname;return Object.keys(l.query).forEach(e=>{if("locale"===e){c=c.replace("[".concat(e,"]"),a);return}c=c.replace("[".concat(e,"]"),String(l.query[e]))}),a&&(r=n?"/".concat(a).concat(n):c),r.startsWith("/".concat(a))||(r="/".concat(a).concat(r)),(0,s.jsx)(g(),{href:r,passHref:!0,legacyBehavior:!0,children:(0,s.jsx)(p.Z,{...t,variant:"link",size:"sm",className:"button-link",onClick:()=>{var e;return null===(e=f.Z.cache)||void 0===e?void 0:e.call(f.Z,a)},children:a.toUpperCase()})})};var k=n(7814);let Z=()=>{let{t:e}=(0,m.$G)("common"),a=(0,h.useRouter)().query.locale||j().i18n.defaultLocale;return(0,s.jsx)(x.Z,{title:(0,s.jsxs)("span",{children:[(0,s.jsx)(k.G,{icon:"globe",className:"me-2"}),e("common.language")]}),id:"language-selector",children:j().i18n.locales.filter(e=>e!==a).map(e=>(0,s.jsx)(x.Z.Item,{children:(0,s.jsx)(N,{locale:e})},e))})};var v=n(5007),w=n(3391);let y=()=>{let{t:e}=(0,m.$G)("common"),a=(0,v.I0)(),n=(0,v.v9)(e=>e.theme.theme);return(0,s.jsxs)("button",{className:"btn theme-toggle-btn d-flex align-items-center gap-2 ".concat(n),onClick:()=>a((0,w.X8)()),"aria-label":e("common.header.themeToggle"),children:[(0,s.jsx)(k.G,{icon:"light"===n?"moon":"sun"}),(0,s.jsx)("span",{children:e("common.header.theme.".concat(n))})]})};function _(){let{t:e}=(0,m.$G)("common");return(0,s.jsx)(t.Z,{expand:"lg",className:"shadow-sm",children:(0,s.jsxs)(l.Z,{children:[(0,s.jsxs)(t.Z.Brand,{as:d.Z,href:"/",className:"d-flex align-items-center link",children:[(0,s.jsx)(o(),{src:"".concat(i.Vc,"/images/logo.png"),alt:e("common.header.logoAlt"),width:40,height:40,priority:!0,className:"rounded-circle"}),(0,s.jsx)("span",{className:"ms-2 fw-bold",style:{fontSize:"1.25rem"},children:e("common.header.title")})]}),(0,s.jsx)(t.Z.Toggle,{"aria-controls":"navbar-nav"}),(0,s.jsx)(t.Z.Collapse,{id:"navbar-nav",children:(0,s.jsxs)(r.Z,{className:"ms-auto d-flex gap-3 align-items-center",children:[(0,s.jsx)(r.Z.Link,{as:d.Z,href:"/",children:e("common.header.menu.home")}),(0,s.jsx)(r.Z.Link,{as:d.Z,href:"/about",children:e("common.header.menu.about")}),(0,s.jsx)(r.Z.Link,{as:d.Z,href:"/contact",children:e("common.header.menu.contact")}),(0,s.jsx)(Z,{}),(0,s.jsx)(y,{})]})})]})})}function P(){let{t:e}=(0,m.$G)("common"),a=new Date().getFullYear();return(0,s.jsx)("footer",{className:"footer py-3",children:(0,s.jsx)(l.Z,{children:(0,s.jsx)("p",{className:"text-center mb-0",children:e("common.footer.text",{year:a})})})})}function G(e){let{children:a}=e;return(0,s.jsxs)(s.Fragment,{children:[(0,s.jsx)(_,{}),(0,s.jsx)("main",{children:(0,s.jsx)(l.Z,{className:"py-5",children:a})}),(0,s.jsx)(P,{})]})}},3205:(e,a,n)=>{"use strict";n.d(a,{Z:()=>c});var s=n(5893);n(7294);var t=n(1664),l=n.n(t),r=n(1163);let c=e=>{let{children:a,skipLocaleHandling:n=!1,href:t,locale:c,className:o,onClick:i,...m}=e,d=(0,r.useRouter)(),h=c||d.query.locale||"",x=t||d.asPath;x.startsWith("http")&&(n=!0),h&&!n&&(x=x?"/".concat(h).concat(x):d.pathname.replace("[locale]",h));let u="link",j=o?"".concat(u," ").concat(o):u;return(0,s.jsx)(l(),{href:x,...m,legacyBehavior:!0,children:(0,s.jsx)("a",{className:j,onClick:e=>{i&&i(e)},children:a})})}},7191:(e,a,n)=>{"use strict";n.d(a,{Z:()=>r});var s=n(1255),t=n(4421),l=n.n(t);let r=(0,s.Z)({fallbackLng:l().i18n.defaultLocale,supportedLngs:l().i18n.locales})},5316:(e,a,n)=>{"use strict";n.r(a),n.d(a,{__N_SSG:()=>d,default:()=>h});var s=n(5893),t=n(7375);n(7294);var l=n(9008),r=n.n(l),c=n(7814),o=n(4622),i=n(270),m=n(3525),d=!0;function h(){let{t:e}=(0,o.$G)(["about"]);return(0,s.jsxs)(m.Z,{children:[(0,s.jsxs)(r(),{children:[(0,s.jsx)("title",{children:e("about.meta.title")}),(0,s.jsx)("meta",{name:"description",content:e("about.meta.description")}),(0,s.jsx)("meta",{name:"keywords",content:e("about.meta.keywords")}),(0,s.jsx)("meta",{name:"author",content:i.x1})]}),(0,s.jsxs)(t.Z,{className:"py-5",style:{maxWidth:"800px"},children:[(0,s.jsx)("h1",{className:"fw-bold mb-4",children:e("about.header")}),(0,s.jsx)("p",{className:"fs-5",children:e("about.description")}),(0,s.jsx)("h2",{className:"fw-bold mt-4",children:e("about.findMeOnline")}),(0,s.jsxs)("ul",{className:"list-unstyled fs-5 mt-3",children:[(0,s.jsxs)("li",{className:"mb-3",children:[(0,s.jsx)(c.G,{icon:"envelope",className:"me-2 text-primary"}),(0,s.jsxs)("strong",{children:[e("about.contactInfo.email"),":"]})," ",(0,s.jsx)("a",{href:i.UP.email,className:"text-decoration-none",children:i.UP.email.replace("mailto:","")})]}),(0,s.jsxs)("li",{className:"mb-3",children:[(0,s.jsx)(c.G,{icon:["fab","linkedin"],className:"me-2 text-info"}),(0,s.jsxs)("strong",{children:[i.ww.linkedin,":"]})," ",(0,s.jsx)("a",{href:i.UP.linkedin,target:"_blank",rel:"noopener noreferrer",className:"text-decoration-none",children:i.UP.linkedin})]}),(0,s.jsxs)("li",{className:"mb-3",children:[(0,s.jsx)(c.G,{icon:["fab","medium"],className:"me-2 text-dark"}),(0,s.jsxs)("strong",{children:[i.ww.medium,":"]})," ",(0,s.jsx)("a",{href:i.UP.medium,target:"_blank",rel:"noopener noreferrer",className:"text-decoration-none",children:i.UP.medium})]}),(0,s.jsxs)("li",{className:"mb-3",children:[(0,s.jsx)(c.G,{icon:["fab","github"],className:"me-2 text-secondary"}),(0,s.jsxs)("strong",{children:[i.ww.github,":"]})," ",(0,s.jsx)("a",{href:i.UP.github,target:"_blank",rel:"noopener noreferrer",className:"text-decoration-none",children:i.UP.github})]})]})]})]})}}},e=>{var a=a=>e(e.s=a);e.O(0,[307,888,774,179],()=>a(815)),_N_E=e.O()}]);