(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[416],{7941:(e,a,n)=>{(window.__NEXT_P=window.__NEXT_P||[]).push(["/[locale]/posts/[id]",function(){return n(9029)}])},4421:e=>{"use strict";e.exports={debug:!1,i18n:{defaultLocale:"en",locales:["en","tr"]},localePath:"/locales",reloadOnPrerender:!1}},3280:(e,a,n)=>{"use strict";n.d(a,{Z:()=>i});var t=n(3967),s=n.n(t),c=n(7294),l=n(7400),r=n(5893);let o=c.forwardRef((e,a)=>{let{bsPrefix:n,bg:t="primary",pill:c=!1,text:o,className:i,as:m="span",...d}=e,h=(0,l.vE)(n,"badge");return(0,r.jsx)(m,{ref:a,...d,className:s()(i,h,c&&"rounded-pill",o&&"text-".concat(o),t&&"bg-".concat(t))})});o.displayName="Badge";let i=o},8841:(e,a,n)=>{"use strict";n.d(a,{Z:()=>r});var t=n(5893);n(7294);var s=n(1163),c=n(4421),l=n.n(c);function r(e){let{date:a,locale:n}=e,c=(0,s.useRouter)(),r=n||c.query.locale||l().i18n.defaultLocale;return(0,t.jsx)("span",{children:new Date(a).toLocaleDateString(r,{year:"numeric",month:"long",day:"numeric"})})}},3525:(e,a,n)=>{"use strict";n.d(a,{Z:()=>G});var t=n(5893),s=n(3814),c=n(7375),l=n(4593),r=n(5675),o=n.n(r),i=n(270),m=n(4622),d=n(3205),h=n(1163),u=n(9580),x=n(4421),j=n.n(x),g=n(7191),p=n(1664),f=n.n(p),Z=n(6720);n(7294);let N=e=>{let{locale:a,href:n,...s}=e,c=(0,h.useRouter)(),l=n||c.asPath,r=c.pathname;return Object.keys(c.query).forEach(e=>{if("locale"===e){r=r.replace("[".concat(e,"]"),a);return}r=r.replace("[".concat(e,"]"),String(c.query[e]))}),a&&(l=n?"/".concat(a).concat(n):r),l.startsWith("/".concat(a))||(l="/".concat(a).concat(l)),(0,t.jsx)(f(),{href:l,passHref:!0,legacyBehavior:!0,children:(0,t.jsx)(Z.Z,{...s,variant:"link",size:"sm",className:"button-link",onClick:()=>{var e;return null===(e=g.Z.cache)||void 0===e?void 0:e.call(g.Z,a)},children:a.toUpperCase()})})};var b=n(7814);let v=()=>{let{t:e}=(0,m.$G)("common"),a=(0,h.useRouter)().query.locale||j().i18n.defaultLocale;return(0,t.jsx)(u.Z,{title:(0,t.jsxs)("span",{children:[(0,t.jsx)(b.G,{icon:"globe",className:"me-2"}),e("common.language")]}),id:"language-selector",children:j().i18n.locales.filter(e=>e!==a).map(e=>(0,t.jsx)(u.Z.Item,{children:(0,t.jsx)(N,{locale:e})},e))})};var y=n(3391),k=n(517);let _=()=>{let{t:e}=(0,m.$G)("common"),a=(0,k.TL)(),n=(0,k.CG)(e=>e.theme.theme);return(0,t.jsxs)("button",{className:"btn theme-toggle-btn d-flex align-items-center gap-2 ".concat(n),onClick:()=>a((0,y.X8)()),"aria-label":e("common.header.themeToggle"),children:[(0,t.jsx)(b.G,{icon:"light"===n?"moon":"sun"}),(0,t.jsx)("span",{children:e("common.header.theme.".concat(n))})]})};function w(){let{t:e}=(0,m.$G)("common");return(0,t.jsx)(s.Z,{expand:"lg",className:"shadow-sm",children:(0,t.jsxs)(c.Z,{children:[(0,t.jsxs)(s.Z.Brand,{as:d.Z,href:"/",className:"d-flex align-items-center link",children:[(0,t.jsx)(o(),{src:"".concat(i.Vc,"/images/logo.png"),alt:e("common.header.logoAlt"),width:40,height:40,priority:!0,className:"rounded-circle"}),(0,t.jsx)("span",{className:"ms-2 fw-bold",style:{fontSize:"1.25rem"},children:e("common.header.title")})]}),(0,t.jsx)(s.Z.Toggle,{"aria-controls":"navbar-nav",children:(0,t.jsx)(b.G,{icon:"bars",className:"navbar-toggler-icon"})}),(0,t.jsx)(s.Z.Collapse,{id:"navbar-nav",children:(0,t.jsxs)(l.Z,{className:"ms-auto d-flex gap-3 align-items-center",children:[(0,t.jsx)(l.Z.Link,{as:d.Z,href:"/",children:e("common.header.menu.home")}),(0,t.jsx)(l.Z.Link,{as:d.Z,href:"/about",children:e("common.header.menu.about")}),(0,t.jsx)(l.Z.Link,{as:d.Z,href:"/contact",children:e("common.header.menu.contact")}),(0,t.jsx)(v,{}),(0,t.jsx)(_,{})]})})]})})}function L(){let{t:e}=(0,m.$G)("common"),a=new Date().getFullYear();return(0,t.jsx)("footer",{className:"footer py-3",children:(0,t.jsx)(c.Z,{children:(0,t.jsx)("p",{className:"text-center mb-0",children:e("common.footer.text",{year:a})})})})}function G(e){let{children:a}=e;return(0,t.jsxs)(t.Fragment,{children:[(0,t.jsx)(w,{}),(0,t.jsx)("main",{children:(0,t.jsx)(c.Z,{className:"py-5",children:a})}),(0,t.jsx)(L,{})]})}},3205:(e,a,n)=>{"use strict";n.d(a,{Z:()=>r});var t=n(5893);n(7294);var s=n(1664),c=n.n(s),l=n(1163);let r=e=>{let{children:a,skipLocaleHandling:n=!1,href:s,locale:r,className:o,onClick:i,...m}=e,d=(0,l.useRouter)(),h=r||d.query.locale||"",u=s||d.asPath;u.startsWith("http")&&(n=!0),h&&!n&&(u=u?"/".concat(h).concat(u):d.pathname.replace("[locale]",h));let x="link",j=o?"".concat(x," ").concat(o):x;return(0,t.jsx)(c(),{href:u,...m,legacyBehavior:!0,children:(0,t.jsx)("a",{className:j,onClick:e=>{i&&i(e)},children:a})})}},7191:(e,a,n)=>{"use strict";n.d(a,{Z:()=>l});var t=n(1255),s=n(4421),c=n.n(s);let l=(0,t.Z)({fallbackLng:c().i18n.defaultLocale,supportedLngs:c().i18n.locales})},9029:(e,a,n)=>{"use strict";n.r(a),n.d(a,{__N_SSG:()=>h,default:()=>u});var t=n(5893);n(7294);var s=n(9008),c=n.n(s),l=n(7375),r=n(3280),o=n(270),i=n(8841);function m(e){let{post:a}=e,{title:n,date:s,contentHtml:c,thumbnail:m,topics:d}=a;return(0,t.jsxs)(l.Z,{className:"mt-5",style:{maxWidth:"700px"},children:[(0,t.jsx)("h1",{className:"fw-bold display-4 text-center mb-4",children:n}),(0,t.jsx)("p",{className:"text-muted text-center mb-4",style:{fontSize:"1.1rem"},children:(0,t.jsx)(i.Z,{date:s})}),d&&d.length>0&&(0,t.jsx)("div",{className:"text-center mb-4",children:d.map(e=>(0,t.jsx)(r.Z,{bg:"secondary",className:"me-2",children:e},e))}),m&&(0,t.jsx)("div",{className:"text-center mb-5",children:(0,t.jsx)("img",{src:"".concat(o.Vc).concat(m),alt:n,className:"img-fluid rounded"})}),(0,t.jsx)("article",{className:"fs-5 lh-lg",dangerouslySetInnerHTML:{__html:c||""}})]})}var d=n(3525),h=!0;function u(e){let{post:a}=e,n=[...a.topics||[]].join(", ");return(0,t.jsxs)(d.Z,{children:[(0,t.jsxs)(c(),{children:[(0,t.jsx)("title",{children:a.title}),(0,t.jsx)("meta",{name:"description",content:a.summary}),(0,t.jsx)("meta",{name:"keywords",content:n}),(0,t.jsx)("meta",{name:"author",content:"Şuayb Şimşek"})]}),(0,t.jsx)(m,{post:a})]})}}},e=>{var a=a=>e(e.s=a);e.O(0,[307,888,774,179],()=>a(7941)),_N_E=e.O()}]);