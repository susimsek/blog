(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[87],{8723:(e,n,a)=>{(window.__NEXT_P=window.__NEXT_P||[]).push(["/[locale]/contact",function(){return a(2642)}])},4421:e=>{"use strict";e.exports={debug:!1,i18n:{defaultLocale:"en",locales:["en","tr"]},localePath:"/locales",reloadOnPrerender:!1}},3525:(e,n,a)=>{"use strict";a.d(n,{Z:()=>G});var t=a(5893),s=a(3814),c=a(7375),l=a(4593),r=a(5675),o=a.n(r),i=a(270),m=a(4622),d=a(3205),h=a(1163),x=a(9580),u=a(4421),j=a.n(u),f=a(7191),g=a(1664),p=a.n(g),N=a(6720);a(7294);let b=e=>{let{locale:n,href:a,...s}=e,c=(0,h.useRouter)(),l=a||c.asPath,r=c.pathname;return Object.keys(c.query).forEach(e=>{if("locale"===e){r=r.replace("[".concat(e,"]"),n);return}r=r.replace("[".concat(e,"]"),String(c.query[e]))}),n&&(l=a?"/".concat(n).concat(a):r),l.startsWith("/".concat(n))||(l="/".concat(n).concat(l)),(0,t.jsx)(p(),{href:l,passHref:!0,legacyBehavior:!0,children:(0,t.jsx)(N.Z,{...s,variant:"link",size:"sm",className:"button-link",onClick:()=>{var e;return null===(e=f.Z.cache)||void 0===e?void 0:e.call(f.Z,n)},children:n.toUpperCase()})})};var k=a(7814);let Z=()=>{let{t:e}=(0,m.$G)("common"),n=(0,h.useRouter)().query.locale||j().i18n.defaultLocale;return(0,t.jsx)(x.Z,{title:(0,t.jsxs)("span",{children:[(0,t.jsx)(k.G,{icon:"globe",className:"me-2"}),e("common.language")]}),id:"language-selector",children:j().i18n.locales.filter(e=>e!==n).map(e=>(0,t.jsx)(x.Z.Item,{children:(0,t.jsx)(b,{locale:e})},e))})};var v=a(3391),w=a(517);let y=()=>{let{t:e}=(0,m.$G)("common"),n=(0,w.TL)(),a=(0,w.CG)(e=>e.theme.theme);return(0,t.jsxs)("button",{className:"btn theme-toggle-btn d-flex align-items-center gap-2 ".concat(a),onClick:()=>n((0,v.X8)()),"aria-label":e("common.header.themeToggle"),children:[(0,t.jsx)(k.G,{icon:"light"===a?"moon":"sun"}),(0,t.jsx)("span",{children:e("common.header.theme.".concat(a))})]})};function _(){let{t:e}=(0,m.$G)("common");return(0,t.jsx)(s.Z,{expand:"lg",className:"shadow-sm",children:(0,t.jsxs)(c.Z,{children:[(0,t.jsxs)(s.Z.Brand,{as:d.Z,href:"/",className:"d-flex align-items-center link",children:[(0,t.jsx)(o(),{src:"".concat(i.Vc,"/images/logo.png"),alt:e("common.header.logoAlt"),width:40,height:40,priority:!0,className:"rounded-circle"}),(0,t.jsx)("span",{className:"ms-2 fw-bold",style:{fontSize:"1.25rem"},children:e("common.header.title")})]}),(0,t.jsx)(s.Z.Toggle,{"aria-controls":"navbar-nav"}),(0,t.jsx)(s.Z.Collapse,{id:"navbar-nav",children:(0,t.jsxs)(l.Z,{className:"ms-auto d-flex gap-3 align-items-center",children:[(0,t.jsx)(l.Z.Link,{as:d.Z,href:"/",children:e("common.header.menu.home")}),(0,t.jsx)(l.Z.Link,{as:d.Z,href:"/about",children:e("common.header.menu.about")}),(0,t.jsx)(l.Z.Link,{as:d.Z,href:"/contact",children:e("common.header.menu.contact")}),(0,t.jsx)(Z,{}),(0,t.jsx)(y,{})]})})]})})}function P(){let{t:e}=(0,m.$G)("common"),n=new Date().getFullYear();return(0,t.jsx)("footer",{className:"footer py-3",children:(0,t.jsx)(c.Z,{children:(0,t.jsx)("p",{className:"text-center mb-0",children:e("common.footer.text",{year:n})})})})}function G(e){let{children:n}=e;return(0,t.jsxs)(t.Fragment,{children:[(0,t.jsx)(_,{}),(0,t.jsx)("main",{children:(0,t.jsx)(c.Z,{className:"py-5",children:n})}),(0,t.jsx)(P,{})]})}},3205:(e,n,a)=>{"use strict";a.d(n,{Z:()=>r});var t=a(5893);a(7294);var s=a(1664),c=a.n(s),l=a(1163);let r=e=>{let{children:n,skipLocaleHandling:a=!1,href:s,locale:r,className:o,onClick:i,...m}=e,d=(0,l.useRouter)(),h=r||d.query.locale||"",x=s||d.asPath;x.startsWith("http")&&(a=!0),h&&!a&&(x=x?"/".concat(h).concat(x):d.pathname.replace("[locale]",h));let u="link",j=o?"".concat(u," ").concat(o):u;return(0,t.jsx)(c(),{href:x,...m,legacyBehavior:!0,children:(0,t.jsx)("a",{className:j,onClick:e=>{i&&i(e)},children:n})})}},7191:(e,n,a)=>{"use strict";a.d(n,{Z:()=>l});var t=a(1255),s=a(4421),c=a.n(s);let l=(0,t.Z)({fallbackLng:c().i18n.defaultLocale,supportedLngs:c().i18n.locales})},2642:(e,n,a)=>{"use strict";a.r(n),a.d(n,{__N_SSG:()=>d,default:()=>h});var t=a(5893),s=a(7375);a(7294);var c=a(9008),l=a.n(c),r=a(7814),o=a(4622),i=a(270),m=a(3525),d=!0;function h(){let{t:e}=(0,o.$G)(["contact"]);return(0,t.jsxs)(m.Z,{children:[(0,t.jsxs)(l(),{children:[(0,t.jsx)("title",{children:e("contact.meta.title")}),(0,t.jsx)("meta",{name:"description",content:e("contact.meta.description")}),(0,t.jsx)("meta",{name:"keywords",content:e("contact.meta.keywords")}),(0,t.jsx)("meta",{name:"author",content:i.x1})]}),(0,t.jsxs)(s.Z,{className:"py-5",style:{maxWidth:"800px"},children:[(0,t.jsx)("h1",{className:"fw-bold mb-4",children:e("contact.header")}),(0,t.jsx)("p",{className:"fs-5",children:e("contact.description")}),(0,t.jsx)("h2",{className:"fw-bold mt-4",children:e("contact.contactInfo.title")}),(0,t.jsxs)("ul",{className:"list-unstyled fs-5 mt-3",children:[(0,t.jsxs)("li",{className:"mb-3",children:[(0,t.jsx)(r.G,{icon:"envelope",className:"me-2 text-primary"}),(0,t.jsxs)("strong",{children:[e("contact.contactInfo.email"),":"]})," ",(0,t.jsx)("a",{href:i.UP.email,className:"text-decoration-none",children:i.UP.email.replace("mailto:","")})]}),(0,t.jsxs)("li",{className:"mb-3",children:[(0,t.jsx)(r.G,{icon:["fab","linkedin"],className:"me-2 text-info"}),(0,t.jsxs)("strong",{children:[i.ww.linkedin,":"]})," ",(0,t.jsx)("a",{href:i.UP.linkedin,target:"_blank",rel:"noopener noreferrer",className:"text-decoration-none",children:i.UP.linkedin})]}),(0,t.jsxs)("li",{className:"mb-3",children:[(0,t.jsx)(r.G,{icon:["fab","medium"],className:"me-2 text-dark"}),(0,t.jsxs)("strong",{children:[i.ww.medium,":"]})," ",(0,t.jsx)("a",{href:i.UP.medium,target:"_blank",rel:"noopener noreferrer",className:"text-decoration-none",children:i.UP.medium})]}),(0,t.jsxs)("li",{className:"mb-3",children:[(0,t.jsx)(r.G,{icon:["fab","github"],className:"me-2 text-secondary"}),(0,t.jsxs)("strong",{children:[i.ww.github,":"]})," ",(0,t.jsx)("a",{href:i.UP.github,target:"_blank",rel:"noopener noreferrer",className:"text-decoration-none",children:i.UP.github})]})]})]})]})}}},e=>{var n=n=>e(e.s=n);e.O(0,[307,888,774,179],()=>n(8723)),_N_E=e.O()}]);