(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[721],{815:(e,a,n)=>{(window.__NEXT_P=window.__NEXT_P||[]).push(["/[locale]/about",function(){return n(5316)}])},4421:e=>{"use strict";e.exports={debug:!1,i18n:{defaultLocale:"en",locales:["en","tr"]},localePath:"/locales",reloadOnPrerender:!1}},8415:(e,a,n)=>{"use strict";n.d(a,{Z:()=>_});var s=n(5893),l=n(3814),t=n(7375),c=n(4593),r=n(5675),o=n.n(r),i=n(270),m=n(4622),d=n(7749),h=n(1163),u=n(848),x=n(4421),j=n.n(x),f=n(7191);n(7294);var b=n(6720);let g=e=>{let{locale:a,href:n}=e,l=(0,h.useRouter)(),t=null!=n?n:l.asPath,c=l.pathname;return Object.keys(l.query).forEach(e=>{if("locale"===e){c=c.replace("[".concat(e,"]"),a);return}c=c.replace("[".concat(e,"]"),String(l.query[e]))}),a&&(t=n?"/".concat(a).concat(n):c),t.startsWith("/".concat(a))||(t="/".concat(a).concat(t)),(0,s.jsx)(b.Z,{variant:"link",size:"sm",className:"button-link",onClick:()=>{var e;null===(e=f.Z.cache)||void 0===e||e.call(f.Z,a),l.push(t)},children:a.toUpperCase()})};var p=n(7814);let N=()=>{let{t:e}=(0,m.$G)("common"),a=(0,h.useRouter)().query.locale||j().i18n.defaultLocale;return(0,s.jsx)(u.Z,{title:(0,s.jsxs)("span",{children:[(0,s.jsx)(p.G,{icon:"globe",className:"me-2"}),e("common.language")]}),id:"language-selector",children:j().i18n.locales.filter(e=>e!==a).map(e=>(0,s.jsx)(u.Z.Item,{children:(0,s.jsx)(g,{locale:e})},e))})};var k=n(3391),Z=n(517);let v=()=>{let{t:e}=(0,m.$G)("common"),a=(0,Z.TL)(),n=(0,Z.CG)(e=>e.theme.theme);return(0,s.jsxs)("button",{className:"btn theme-toggle-btn d-flex align-items-center gap-2 ".concat(n),onClick:()=>a((0,k.X8)()),"aria-label":e("common.header.themeToggle"),children:[(0,s.jsx)(p.G,{icon:"light"===n?"moon":"sun"}),(0,s.jsx)("span",{children:e("common.header.theme.".concat(n))})]})};function w(){let{t:e}=(0,m.$G)("common");return(0,s.jsx)(l.Z,{expand:"lg",className:"shadow-sm",children:(0,s.jsxs)(t.Z,{children:[(0,s.jsxs)(l.Z.Brand,{as:d.Z,href:"/",className:"d-flex align-items-center link",children:[(0,s.jsx)(o(),{src:"".concat(i.Vc,"/images/logo.png"),alt:e("common.header.logoAlt"),width:40,height:40,priority:!0,className:"rounded-circle"}),(0,s.jsx)("span",{className:"ms-2 fw-bold",style:{fontSize:"1.25rem"},children:e("common.header.title")})]}),(0,s.jsx)(l.Z.Toggle,{"aria-controls":"navbar-nav",children:(0,s.jsx)(p.G,{icon:"bars",className:"navbar-toggler-icon"})}),(0,s.jsx)(l.Z.Collapse,{id:"navbar-nav",children:(0,s.jsxs)(c.Z,{className:"ms-auto d-flex gap-3 align-items-center",children:[(0,s.jsxs)(c.Z.Link,{as:d.Z,href:"/",children:[(0,s.jsx)(p.G,{icon:"home",className:"me-2"}),e("common.header.menu.home")]}),(0,s.jsxs)(c.Z.Link,{as:d.Z,href:"/about",children:[(0,s.jsx)(p.G,{icon:"info-circle",className:"me-2"}),e("common.header.menu.about")]}),(0,s.jsxs)(c.Z.Link,{as:d.Z,href:"/contact",children:[(0,s.jsx)(p.G,{icon:"address-book",className:"me-2"}),e("common.header.menu.contact")]}),(0,s.jsx)(N,{}),(0,s.jsx)(v,{})]})})]})})}function y(){let{t:e}=(0,m.$G)("common"),a=new Date().getFullYear();return(0,s.jsx)("footer",{className:"footer py-3",children:(0,s.jsx)(t.Z,{children:(0,s.jsx)("p",{className:"text-center mb-0",children:e("common.footer.text",{year:a})})})})}function _(e){let{children:a}=e;return(0,s.jsxs)(s.Fragment,{children:[(0,s.jsx)(w,{}),(0,s.jsx)("main",{children:(0,s.jsx)(t.Z,{className:"py-5",children:a})}),(0,s.jsx)(y,{})]})}},7749:(e,a,n)=>{"use strict";n.d(a,{Z:()=>r});var s=n(5893);n(7294);var l=n(1664),t=n.n(l),c=n(1163);let r=e=>{var a;let{children:n,skipLocaleHandling:l=!1,href:r,locale:o,className:i,onClick:m,...d}=e,h=(0,c.useRouter)(),u=null!==(a=null!=o?o:h.query.locale)&&void 0!==a?a:"",x=null!=r?r:h.asPath;x.startsWith("http")&&(l=!0),u&&!l&&(x=x?"/".concat(u).concat(x):h.pathname.replace("[locale]",u));let j="link",f=i?"".concat(j," ").concat(i):j;return(0,s.jsx)(t(),{href:x,...d,legacyBehavior:!0,children:(0,s.jsx)("a",{className:f,onClick:e=>{m&&m(e)},onKeyDown:e=>{("Enter"===e.key||" "===e.key)&&(e.preventDefault(),null==m||m(e))},children:n})})}},7191:(e,a,n)=>{"use strict";n.d(a,{Z:()=>c});var s=n(1255),l=n(4421),t=n.n(l);let c=(0,s.Z)({fallbackLng:t().i18n.defaultLocale,supportedLngs:t().i18n.locales})},5316:(e,a,n)=>{"use strict";n.r(a),n.d(a,{__N_SSG:()=>d,default:()=>h});var s=n(5893),l=n(7375);n(7294);var t=n(9008),c=n.n(t),r=n(7814),o=n(4622),i=n(270),m=n(8415),d=!0;function h(){let{t:e}=(0,o.$G)(["about"]);return(0,s.jsxs)(m.Z,{children:[(0,s.jsxs)(c(),{children:[(0,s.jsx)("title",{children:e("about.meta.title")}),(0,s.jsx)("meta",{name:"description",content:e("about.meta.description")}),(0,s.jsx)("meta",{name:"keywords",content:e("about.meta.keywords")}),(0,s.jsx)("meta",{name:"author",content:i.x1})]}),(0,s.jsxs)(l.Z,{className:"py-5",style:{maxWidth:"800px"},children:[(0,s.jsx)("h1",{className:"fw-bold mb-4",children:e("about.header")}),(0,s.jsx)("p",{className:"fs-5",children:e("about.description")}),(0,s.jsx)("h2",{className:"fw-bold mt-4",children:e("about.findMeOnline")}),(0,s.jsxs)("ul",{className:"list-unstyled fs-5 mt-3",children:[(0,s.jsxs)("li",{className:"mb-3",children:[(0,s.jsx)(r.G,{icon:"envelope",className:"me-2 text-primary"}),(0,s.jsxs)("strong",{children:[e("about.contactInfo.email"),":"]})," ",(0,s.jsx)("a",{href:i.UP.email,className:"text-decoration-none",children:i.UP.email.replace("mailto:","")})]}),(0,s.jsxs)("li",{className:"mb-3",children:[(0,s.jsx)(r.G,{icon:["fab","linkedin"],className:"me-2 text-info"}),(0,s.jsxs)("strong",{children:[i.ww.linkedin,":"]})," ",(0,s.jsx)("a",{href:i.UP.linkedin,target:"_blank",rel:"noopener noreferrer",className:"text-decoration-none",children:i.UP.linkedin})]}),(0,s.jsxs)("li",{className:"mb-3",children:[(0,s.jsx)(r.G,{icon:["fab","medium"],className:"me-2 text-dark"}),(0,s.jsxs)("strong",{children:[i.ww.medium,":"]})," ",(0,s.jsx)("a",{href:i.UP.medium,target:"_blank",rel:"noopener noreferrer",className:"text-decoration-none",children:i.UP.medium})]}),(0,s.jsxs)("li",{className:"mb-3",children:[(0,s.jsx)(r.G,{icon:["fab","github"],className:"me-2 text-secondary"}),(0,s.jsxs)("strong",{children:[i.ww.github,":"]})," ",(0,s.jsx)("a",{href:i.UP.github,target:"_blank",rel:"noopener noreferrer",className:"text-decoration-none",children:i.UP.github})]})]})]})]})}}},e=>{var a=a=>e(e.s=a);e.O(0,[532,888,774,179],()=>a(815)),_N_E=e.O()}]);