(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[513],{3124:(e,s,t)=>{(window.__NEXT_P=window.__NEXT_P||[]).push(["/[locale]",function(){return t(5777)}])},4421:e=>{"use strict";e.exports={debug:!1,i18n:{defaultLocale:"en",locales:["en","tr"]},localePath:"/locales",reloadOnPrerender:!1}},7143:(e,s,t)=>{"use strict";t.d(s,{Z:()=>r});var a=t(5893);t(7294);var n=t(1163),l=t(4421),c=t.n(l);function r(e){var s;let{date:t,locale:l}=e,r=(0,n.useRouter)(),o=null!==(s=null!=l?l:r.query.locale)&&void 0!==s?s:c().i18n.defaultLocale;return(0,a.jsx)("span",{children:new Date(t).toLocaleDateString(o,{year:"numeric",month:"long",day:"numeric"})})}},8415:(e,s,t)=>{"use strict";t.d(s,{Z:()=>C});var a=t(5893),n=t(3814),l=t(7375),c=t(4593),r=t(5675),o=t.n(r),i=t(270),m=t(4622),d=t(7749),h=t(1163),x=t(848),u=t(4421),j=t.n(u),p=t(6720),g=t(7191);let f=e=>{let{locale:s,href:t}=e,n=(0,h.useRouter)(),l=null!=t?t:n.asPath,c=n.pathname;return Object.keys(n.query).forEach(e=>{if("locale"===e){c=c.replace("[".concat(e,"]"),s);return}c=c.replace("[".concat(e,"]"),String(n.query[e]))}),t&&!t.startsWith("http")&&s&&(l="/".concat(s).concat(t)),l.startsWith("/".concat(s))||(null==t?void 0:t.startsWith("http"))||(l="/".concat(s).concat(l)),(0,a.jsx)(p.Z,{variant:"link",size:"sm",className:"button-link",onClick:()=>{var e;null===(e=g.Z.cache)||void 0===e||e.call(g.Z,s),n.push(l)},children:s.toUpperCase()})};var N=t(7814);let Z=()=>{let{t:e}=(0,m.$G)("common"),s=(0,h.useRouter)().query.locale||j().i18n.defaultLocale;return(0,a.jsx)(x.Z,{title:(0,a.jsxs)("span",{children:[(0,a.jsx)(N.G,{icon:"globe",className:"me-2"}),e("common.language")]}),id:"language-selector",children:j().i18n.locales.filter(e=>e!==s).map(e=>(0,a.jsx)(x.Z.Item,{children:(0,a.jsx)(f,{locale:e})},e))})};var v=t(3391),b=t(517);let w=()=>{let{t:e}=(0,m.$G)("common"),s=(0,b.TL)(),t=(0,b.CG)(e=>e.theme.theme);return(0,a.jsxs)("button",{className:"btn theme-toggle-btn d-flex align-items-center gap-2 ".concat(t),onClick:()=>s((0,v.X8)()),"aria-label":e("common.header.themeToggle"),children:[(0,a.jsx)(N.G,{icon:"light"===t?"moon":"sun"}),(0,a.jsx)("span",{children:e("common.header.theme.".concat(t))})]})};function y(){let{t:e}=(0,m.$G)("common");return(0,a.jsx)(n.Z,{expand:"lg",className:"shadow-sm",children:(0,a.jsxs)(l.Z,{children:[(0,a.jsxs)(n.Z.Brand,{as:d.Z,href:"/",className:"d-flex align-items-center link",children:[(0,a.jsx)(o(),{src:"".concat(i.Vc,"/images/logo.png"),alt:e("common.header.logoAlt"),width:40,height:40,priority:!0,className:"rounded-circle"}),(0,a.jsx)("span",{className:"ms-2 fw-bold",style:{fontSize:"1.25rem"},children:e("common.header.title")})]}),(0,a.jsx)(n.Z.Toggle,{"aria-controls":"navbar-nav",children:(0,a.jsx)(N.G,{icon:"bars",className:"navbar-toggler-icon"})}),(0,a.jsx)(n.Z.Collapse,{id:"navbar-nav",children:(0,a.jsxs)(c.Z,{className:"ms-auto d-flex gap-3 align-items-center",children:[(0,a.jsxs)(c.Z.Link,{as:d.Z,href:"/",children:[(0,a.jsx)(N.G,{icon:"home",className:"me-2"}),e("common.header.menu.home")]}),(0,a.jsxs)(c.Z.Link,{as:d.Z,href:"/about",children:[(0,a.jsx)(N.G,{icon:"info-circle",className:"me-2"}),e("common.header.menu.about")]}),(0,a.jsxs)(c.Z.Link,{as:d.Z,href:"/contact",children:[(0,a.jsx)(N.G,{icon:"address-book",className:"me-2"}),e("common.header.menu.contact")]}),(0,a.jsx)(Z,{}),(0,a.jsx)(w,{})]})})]})})}function k(){let{t:e}=(0,m.$G)("common"),s=new Date().getFullYear();return(0,a.jsx)("footer",{className:"footer py-3",children:(0,a.jsx)(l.Z,{children:(0,a.jsx)("p",{className:"text-center mb-0",children:e("common.footer.text",{year:s})})})})}function C(e){let{children:s}=e;return(0,a.jsxs)(a.Fragment,{children:[(0,a.jsx)(y,{}),(0,a.jsx)("main",{children:(0,a.jsx)(l.Z,{className:"py-5",children:s})}),(0,a.jsx)(k,{})]})}t(7294)},7749:(e,s,t)=>{"use strict";t.d(s,{Z:()=>r});var a=t(5893);t(7294);var n=t(1664),l=t.n(n),c=t(1163);let r=e=>{var s;let{children:t,skipLocaleHandling:n=!1,href:r,locale:o,className:i,onClick:m,...d}=e,h=(0,c.useRouter)(),x=null!==(s=null!=o?o:h.query.locale)&&void 0!==s?s:"",u=null!=r?r:h.asPath;u.startsWith("http")&&(n=!0),x&&!n&&(u=u?"/".concat(x).concat(u):h.pathname.replace("[locale]",x));let j="link",p=i?"".concat(j," ").concat(i):j;return(0,a.jsx)(l(),{href:u,...d,legacyBehavior:!0,children:(0,a.jsx)("a",{className:p,onClick:e=>{m&&m(e)},onKeyDown:e=>{("Enter"===e.key||" "===e.key)&&(e.preventDefault(),null==m||m(e))},children:t})})}},2285:(e,s,t)=>{"use strict";t.d(s,{Z:()=>c});var a=t(5893),n=t(5675),l=t.n(n);function c(e){let{src:s,alt:t,width:n=800,height:c=600,className:r="",priority:o=!0}=e;return(0,a.jsx)("div",{className:"text-center mb-4 ".concat(r),children:(0,a.jsx)(l(),{src:s,alt:t,className:"img-fluid rounded",width:n,height:c,style:{width:"100%",height:"auto"},priority:o})})}},7191:(e,s,t)=>{"use strict";t.d(s,{Z:()=>c});var a=t(1255),n=t(4421),l=t.n(n);let c=(0,a.Z)({fallbackLng:l().i18n.defaultLocale,supportedLngs:l().i18n.locales})},5777:(e,s,t)=>{"use strict";t.r(s),t.d(s,{__N_SSG:()=>L,default:()=>S});var a=t(5893),n=t(9008),l=t.n(n),c=t(4622),r=t(270),o=t(8415),i=t(7294),m=t(7375),d=t(5742),h=t(2135),x=t(7814);function u(e){let{query:s,onChange:t}=e,{t:n}=(0,c.$G)("common");return(0,a.jsxs)("div",{className:"mb-4 search-bar",children:[(0,a.jsx)("input",{type:"text",className:"search-input",placeholder:n("common.searchBar.placeholder"),value:s,onChange:e=>{t(e.target.value)}}),(0,a.jsx)("div",{className:"search-icon",children:(0,a.jsx)(x.G,{icon:"search"})})]})}var j=t(9101),p=t(8070),g=t(3933);let f=e=>{let{currentPage:s,totalPages:t,maxPagesToShow:n=5,onPageChange:l,className:c=""}=e,r=[],o=Math.max(1,Math.min(s-Math.floor(n/2),t-n+1)),i=Math.min(t,o+n-1);r.push((0,a.jsx)(g.Z.First,{disabled:1===s,onClick:()=>l(1)},"first"),(0,a.jsx)(g.Z.Prev,{disabled:1===s,onClick:()=>l(s-1)},"prev")),o>1&&(r.push((0,a.jsx)(g.Z.Item,{onClick:()=>l(1),children:"1"},1)),o>2&&r.push((0,a.jsx)(g.Z.Ellipsis,{disabled:!0},"start-ellipsis")));for(let e=o;e<=i;e++)r.push((0,a.jsx)(g.Z.Item,{active:e===s,onClick:()=>l(e),children:e},e));return i<t&&(i<t-1&&r.push((0,a.jsx)(g.Z.Ellipsis,{disabled:!0},"end-ellipsis")),r.push((0,a.jsx)(g.Z.Item,{onClick:()=>l(t),children:t},t))),r.push((0,a.jsx)(g.Z.Next,{disabled:s===t,onClick:()=>l(s+1)},"next"),(0,a.jsx)(g.Z.Last,{disabled:s===t,onClick:()=>l(t)},"last")),(0,a.jsx)(g.Z,{className:c,children:r})};var N=t(7137);let Z=e=>{let{size:s=5,pageSizeOptions:t=[5,10,20],onSizeChange:n}=e;return(0,a.jsxs)(N.Z.Group,{controlId:"postsPerPageSelect",className:"d-flex align-items-center",children:[(0,a.jsx)(N.Z.Label,{className:"me-2",children:"Page size:"}),(0,a.jsx)(N.Z.Select,{className:"mb-2",value:s,onChange:e=>n(Number(e.target.value)),style:{width:"100px"},children:t.map(e=>(0,a.jsx)("option",{value:e,children:e},e))})]})};function v(e){let{currentPage:s,totalPages:t,totalResults:n,size:l,pageSizeOptions:r=[5,10,20],maxPagesToShow:o=5,onPageChange:i,onSizeChange:d}=e,{t:h}=(0,c.$G)("common"),x=Math.min(s*l,n);return(0,a.jsx)(m.Z,{className:"pagination-bar",children:(0,a.jsxs)(j.Z,{className:"align-items-center flex-wrap",children:[(0,a.jsx)(p.Z,{xs:"auto",className:"d-flex align-items-center pagination",children:(0,a.jsx)(f,{className:"pagination mb-2",currentPage:s,totalPages:t,onPageChange:i,maxPagesToShow:o})}),(0,a.jsx)(p.Z,{xs:"auto",className:"d-flex align-items-center results-info",children:(0,a.jsx)("p",{className:"text-muted mb-2",children:h("common.pagination.showingResults",{start:(s-1)*l+1,end:x,total:n})})}),(0,a.jsx)(p.Z,{xs:"auto",className:"d-flex align-items-center page-size-selector",children:(0,a.jsx)(Z,{size:l,pageSizeOptions:r,onSizeChange:d})})]})})}var b=t(7749),w=t(3280),y=t(6720),k=t(7143),C=t(2285);function G(e){let{post:s}=e,{id:t,title:n,date:l,summary:o,thumbnail:i,topics:m}=s,{t:d}=(0,c.$G)("post");return(0,a.jsx)("div",{className:"post-card d-flex align-items-center mb-4",children:(0,a.jsxs)("div",{className:"post-card-content flex-grow-1",children:[(0,a.jsx)("h2",{className:"fw-bold mb-4",children:(0,a.jsx)(b.Z,{href:"/posts/".concat(t),className:"link",children:n})}),(0,a.jsx)("p",{className:"text-muted",children:(0,a.jsx)(b.Z,{href:"/posts/".concat(t),children:(0,a.jsx)(k.Z,{date:l})})}),m&&m.length>0&&(0,a.jsx)("div",{className:"mb-4",children:m.map(e=>(0,a.jsx)(w.Z,{bg:"secondary",className:"me-2",children:e},e))}),i&&(0,a.jsx)(b.Z,{href:"/posts/".concat(t),children:(0,a.jsx)(C.Z,{className:"thumbnail-wrapper",src:"".concat(r.Vc).concat(i),alt:n,width:800,height:600})}),(0,a.jsx)("p",{className:"text-muted mb-4",children:o}),(0,a.jsx)("div",{className:"mb-4",children:(0,a.jsx)(b.Z,{href:"/posts/".concat(t),children:(0,a.jsx)(y.Z,{className:"primary",children:d("post.readMore")})})})]})})}function P(e){let{posts:s}=e,{t}=(0,c.$G)(["post","common"]),[n,l]=(0,i.useState)(5),[r,o]=(0,i.useState)(1),[x,j]=(0,i.useState)(""),[p,g]=(0,i.useState)("desc"),f=e=>{g(e),o(1)},N=[...s.filter(e=>e.title.toLowerCase().includes(x.toLowerCase())||e.summary.toLowerCase().includes(x.toLowerCase()))].sort((e,s)=>"asc"===p?new Date(e.date).getTime()-new Date(s.date).getTime():new Date(s.date).getTime()-new Date(e.date).getTime()),Z=Math.ceil(N.length/n),b=N.slice((r-1)*n,r*n),w=N.length;return(0,a.jsxs)(m.Z,{className:"mt-5",style:{maxWidth:"700px"},children:[(0,a.jsx)(u,{query:x,onChange:e=>{j(e),o(1)}}),(0,a.jsx)("div",{className:"d-flex justify-content-start mb-4",children:(0,a.jsxs)(d.Z,{id:"sort-dropdown",title:t("asc"===p?"common:common.sort.oldest":"common:common.sort.newest"),onSelect:e=>{e&&f(e)},children:[(0,a.jsx)(h.Z.Item,{eventKey:"desc",children:t("common:common.sort.newest")}),(0,a.jsx)(h.Z.Item,{eventKey:"asc",children:t("common:common.sort.oldest")})]})}),b.length>0?b.map(e=>(0,a.jsx)(G,{post:e},e.id)):(0,a.jsx)("p",{className:"text-center text-muted",children:t("post.noPostsFound")}),N.length>0&&(0,a.jsx)(v,{currentPage:r,totalPages:Z,size:n,onPageChange:e=>o(e),onSizeChange:e=>{l(e),o(1)},totalResults:w})]})}var L=!0;function S(e){let{posts:s}=e,{t}=(0,c.$G)("home");return(0,a.jsxs)(o.Z,{children:[(0,a.jsxs)(l(),{children:[(0,a.jsx)("title",{children:t("home.title")}),(0,a.jsx)("meta",{name:"description",content:t("home.meta.description")}),(0,a.jsx)("meta",{name:"keywords",content:t("home.meta.keywords")}),(0,a.jsx)("meta",{name:"author",content:r.x1})]}),(0,a.jsxs)("div",{children:[(0,a.jsxs)("header",{className:"text-center py-4",children:[(0,a.jsx)("h1",{className:"fw-bold mb-4",children:t("home.header.title")}),(0,a.jsx)("p",{className:"text-muted fs-4",children:t("home.header.subtitle")})]}),(0,a.jsx)(P,{posts:s})]})]})}}},e=>{var s=s=>e(e.s=s);e.O(0,[532,450,888,774,179],()=>s(3124)),_N_E=e.O()}]);