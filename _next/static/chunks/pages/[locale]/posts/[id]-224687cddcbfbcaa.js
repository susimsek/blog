(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[416],{47941:(e,t,n)=>{(window.__NEXT_P=window.__NEXT_P||[]).push(["/[locale]/posts/[id]",function(){return n(74871)}])},34421:e=>{"use strict";e.exports={debug:!1,i18n:{defaultLocale:"en",locales:["en","tr"]},localePath:"/locales",reloadOnPrerender:!1}},97143:(e,t,n)=>{"use strict";n.d(t,{Z:()=>r});var l=n(85893);n(67294);var a=n(11163),s=n(34421),c=n.n(s);function r(e){var t;let{date:n,locale:s}=e,r=(0,a.useRouter)(),o=null!==(t=null!=s?s:r.query.locale)&&void 0!==t?t:c().i18n.defaultLocale;return(0,l.jsx)("span",{children:new Date(n).toLocaleDateString(o,{year:"numeric",month:"long",day:"numeric"})})}},18415:(e,t,n)=>{"use strict";n.d(t,{Z:()=>_});var l=n(85893),a=n(65952),s=n(97375),c=n(94593),r=n(25675),o=n.n(r),i=n(70270),d=n(48352),m=n(27749),h=n(11163),u=n(50848),x=n(34421),j=n.n(x),p=n(76720),g=n(47191);let f=e=>{let{locale:t,href:n}=e,a=(0,h.useRouter)(),s=null!=n?n:a.asPath,c=a.pathname;return Object.keys(a.query).forEach(e=>{if("locale"===e){c=c.replace("[".concat(e,"]"),t);return}c=c.replace("[".concat(e,"]"),String(a.query[e]))}),!t||(null==n?void 0:n.startsWith("http"))||(s=n?"/".concat(t).concat(n):c),s.startsWith("/".concat(t))||(null==n?void 0:n.startsWith("http"))||(s="/".concat(t).concat(s)),(0,l.jsx)(p.Z,{variant:"link",size:"sm",className:"button-link",onClick:()=>{var e;null===(e=g.Z.cache)||void 0===e||e.call(g.Z,t),a.push(s)},children:t.toUpperCase()})};var N=n(67814);let Z=()=>{let{t:e}=(0,d.$G)("common"),t=(0,h.useRouter)().query.locale||j().i18n.defaultLocale;return(0,l.jsx)(u.Z,{title:(0,l.jsxs)("span",{children:[(0,l.jsx)(N.G,{icon:"globe",className:"me-2"}),e("common.language")]}),id:"language-selector",children:j().i18n.locales.filter(e=>e!==t).map(e=>(0,l.jsx)(u.Z.Item,{children:(0,l.jsx)(f,{locale:e})},e))})};var v=n(93419),b=n(70517);let y=()=>{let{t:e}=(0,d.$G)("common"),t=(0,b.TL)(),n=(0,b.CG)(e=>e.theme.theme);return(0,l.jsxs)("button",{className:"btn theme-toggle-btn d-flex align-items-center gap-2 ".concat(n),onClick:()=>t((0,v.X8)()),"aria-label":e("common.header.themeToggle"),children:[(0,l.jsx)(N.G,{icon:"light"===n?"moon":"sun"}),(0,l.jsx)("span",{children:e("common.header.theme.".concat("light"===n?"dark":"light"))})]})};function k(){let{t:e}=(0,d.$G)("common");return(0,l.jsx)(a.Z,{expand:"lg",className:"shadow-sm",sticky:"top",children:(0,l.jsxs)(s.Z,{children:[(0,l.jsxs)(a.Z.Brand,{as:m.Z,href:"/",className:"d-flex align-items-center link",children:[(0,l.jsx)(o(),{src:"".concat(i.Vc,"/images/logo.png"),alt:e("common.header.logoAlt"),width:40,height:40,priority:!0,className:"rounded-circle"}),(0,l.jsx)("span",{className:"ms-2 fw-bold",style:{fontSize:"1.25rem"},children:e("common.header.title")})]}),(0,l.jsx)(a.Z.Toggle,{"aria-controls":"navbar-nav",children:(0,l.jsx)(N.G,{icon:"bars",className:"navbar-toggler-icon"})}),(0,l.jsx)(a.Z.Collapse,{id:"navbar-nav",children:(0,l.jsxs)(c.Z,{className:"ms-auto d-flex gap-3 align-items-center",children:[(0,l.jsxs)(c.Z.Link,{as:m.Z,href:"/",children:[(0,l.jsx)(N.G,{icon:"home",className:"me-2"}),e("common.header.menu.home")]}),(0,l.jsxs)(c.Z.Link,{as:m.Z,href:"/about",children:[(0,l.jsx)(N.G,{icon:"info-circle",className:"me-2"}),e("common.header.menu.about")]}),(0,l.jsxs)(c.Z.Link,{as:m.Z,href:"/contact",children:[(0,l.jsx)(N.G,{icon:"address-book",className:"me-2"}),e("common.header.menu.contact")]}),(0,l.jsx)(Z,{}),(0,l.jsx)(y,{})]})})]})})}function w(){let{t:e}=(0,d.$G)("common"),t=new Date().getFullYear();return(0,l.jsx)("footer",{className:"footer py-3",children:(0,l.jsx)(s.Z,{children:(0,l.jsx)("p",{className:"text-center mb-0",children:e("common.footer.text",{year:t})})})})}function _(e){let{children:t}=e;return(0,l.jsxs)(l.Fragment,{children:[(0,l.jsx)(k,{}),(0,l.jsx)("main",{children:(0,l.jsx)(s.Z,{className:"py-5",children:t})}),(0,l.jsx)(w,{})]})}n(67294)},27749:(e,t,n)=>{"use strict";n.d(t,{Z:()=>r});var l=n(85893);n(67294);var a=n(41664),s=n.n(a),c=n(11163);let r=e=>{var t;let{children:n,skipLocaleHandling:a=!1,href:r,locale:o,className:i,onClick:d,...m}=e,h=(0,c.useRouter)(),u=null!==(t=null!=o?o:h.query.locale)&&void 0!==t?t:"",x=null!=r?r:h.asPath;x.startsWith("http")&&(a=!0),u&&!a&&(x=x?"/".concat(u).concat(x):h.pathname.replace("[locale]",u));let j="link",p=i?"".concat(j," ").concat(i):j;return(0,l.jsx)(s(),{href:x,...m,legacyBehavior:!0,children:(0,l.jsx)("a",{className:p,onClick:e=>{d&&d(e)},onKeyDown:e=>{("Enter"===e.key||" "===e.key)&&(e.preventDefault(),null==d||d(e))},children:n})})}},92285:(e,t,n)=>{"use strict";n.d(t,{Z:()=>c});var l=n(85893),a=n(25675),s=n.n(a);function c(e){let{src:t,alt:n,width:a=800,height:c=600,className:r="",priority:o=!0}=e;return(0,l.jsx)("div",{className:"text-center mb-4 ".concat(r),children:(0,l.jsx)(s(),{src:t,alt:n,className:"img-fluid rounded",width:a,height:c,style:{width:"100%",height:"auto"},priority:o})})}},47191:(e,t,n)=>{"use strict";n.d(t,{Z:()=>c});var l=n(11255),a=n(34421),s=n.n(a);let c=(0,l.Z)({fallbackLng:s().i18n.defaultLocale,supportedLngs:s().i18n.locales})},74871:(e,t,n)=>{"use strict";n.r(t),n.d(t,{__N_SSG:()=>S,default:()=>E});var l=n(85893),a=n(67294),s=n(9008),c=n.n(s),r=n(97375),o=n(53280),i=n(70270),d=n(97143),m=n(92285),h=n(41664),u=n.n(h),x=n(72510),j=n(4958),p=n(70517),g=n(48352),f=n(93179),N=n(84283),Z=n(73190),v=n(46350),b=n(76720),y=n(67814);let k=e=>{let{inline:t,className:n,children:s,theme:c,t:r,...o}=e,[i,d]=(0,a.useState)(!1),m="dark"===c?N.m4:N.$E,h=/language-(\w+)/.exec(null!=n?n:"");return t?(0,l.jsx)("code",{className:n,...o,children:s}):h?(0,l.jsxs)("div",{className:"code-block-container",children:[(0,l.jsx)(f.Z,{style:m,language:h[1],PreTag:"div",...o,children:String(s).replace(/\n$/,"")}),(0,l.jsx)(Z.Z,{placement:"top",overlay:(0,l.jsx)(v.Z,{id:"copy-tooltip",children:r(i?"common.codeBlock.copied":"common.codeBlock.copy")}),children:(0,l.jsx)(b.Z,{className:"copy-button",size:"sm",onClick:()=>{s&&(navigator.clipboard.writeText(String(s)),d(!0),setTimeout(()=>d(!1),2e3))},children:(0,l.jsx)(y.G,{icon:i?"check":"copy",className:"me-2 fa-icon"})})})]}):(0,l.jsx)("code",{className:n,...o,children:s})};var w=n(10798),_=n(88287);let G=(e,t)=>({code:n=>{let{inline:a,className:s,children:c,...r}=n;return(0,l.jsx)(k,{inline:a,className:s,theme:e,t:t,...r,children:c})},table:e=>{let{children:t}=e;return(0,l.jsx)(_.Z,{striped:!0,bordered:!0,children:t})},th:e=>{let{children:t}=e;return(0,l.jsx)("th",{children:t})},td:e=>{let{children:t}=e;return(0,l.jsx)("td",{children:t})},ul:e=>{let{children:t}=e;return(0,l.jsx)("ul",{className:"list-group list-group-flush",children:t})},ol:e=>{let{children:t}=e;return(0,l.jsx)("ol",{className:"list-group list-group-numbered",children:t})},li:e=>{let{children:t}=e;return(0,l.jsx)("li",{className:"list-group-item",children:t})},a:e=>{let{href:t,children:n}=e;return(0,l.jsx)("a",{href:t,target:"_blank",rel:"noopener noreferrer",className:"text-decoration-none text-primary",children:n})}}),L=e=>{let{content:t}=e,{t:n}=(0,g.$G)("common"),s=(0,p.CG)(e=>e.theme.theme),c=(0,a.useMemo)(()=>G(s,n),[s,n]);return(0,l.jsx)(x.U,{remarkPlugins:[j.Z],rehypePlugins:[w.Z],components:c,children:t})};function C(e){let{post:t}=e,{title:n,date:a,contentHtml:s,thumbnail:c,topics:h}=t;return(0,l.jsxs)(r.Z,{className:"mt-5",style:{maxWidth:"800px"},children:[(0,l.jsx)("h1",{className:"fw-bold display-4 text-center mb-4",children:n}),(0,l.jsx)("p",{className:"text-muted text-center mb-4",style:{fontSize:"1.1rem"},children:(0,l.jsx)(d.Z,{date:a})}),h&&h.length>0&&(0,l.jsx)("div",{className:"mb-4",children:h.map(e=>(0,l.jsx)(u(),{href:"/topics/".concat(e.id),children:(0,l.jsx)(o.Z,{bg:e.color,className:"me-2 badge-".concat(e.color),children:e.name})},e.id))}),c&&(0,l.jsx)(m.Z,{src:"".concat(i.Vc).concat(c),alt:n,width:800,height:600}),(0,l.jsx)("article",{className:"fs-5 lh-lg",children:(0,l.jsx)(L,{content:null!=s?s:""})})]})}var P=n(18415),S=!0;function E(e){var t;let{post:n}=e,a=(null!==(t=n.topics)&&void 0!==t?t:[]).map(e=>e.name).join(", ");return(0,l.jsxs)(P.Z,{children:[(0,l.jsxs)(c(),{children:[(0,l.jsx)("title",{children:n.title}),(0,l.jsx)("meta",{name:"description",content:n.summary}),(0,l.jsx)("meta",{name:"keywords",content:a}),(0,l.jsx)("meta",{name:"author",content:i.x1})]}),(0,l.jsx)(C,{post:n})]})}}},e=>{var t=t=>e(e.s=t);e.O(0,[537,748,888,774,179],()=>t(47941)),_N_E=e.O()}]);