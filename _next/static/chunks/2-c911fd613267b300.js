"use strict";(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[2],{34421:e=>{e.exports={debug:!1,i18n:{defaultLocale:"en",locales:["en","tr"]},localePath:"/locales",reloadOnPrerender:!1}},97143:(e,s,t)=>{t.d(s,{Z:()=>r});var a=t(85893);t(67294);var n=t(11163),l=t(34421),c=t.n(l);function r(e){var s;let{date:t,locale:l}=e,r=(0,n.useRouter)(),o=null!==(s=null!=l?l:r.query.locale)&&void 0!==s?s:c().i18n.defaultLocale;return(0,a.jsx)("span",{children:new Date(t).toLocaleDateString(o,{year:"numeric",month:"long",day:"numeric"})})}},18415:(e,s,t)=>{t.d(s,{Z:()=>C});var a=t(85893),n=t(65952),l=t(97375),c=t(91175),r=t(25675),o=t.n(r),i=t(70270),m=t(48352),d=t(27749),h=t(11163),x=t(50848),u=t(34421),j=t.n(u),p=t(76720),g=t(47191);let f=e=>{let{locale:s,href:t}=e,n=(0,h.useRouter)(),l=null!=t?t:n.asPath,c=n.pathname;return Object.keys(n.query).forEach(e=>{if("locale"===e){c=c.replace("[".concat(e,"]"),s);return}c=c.replace("[".concat(e,"]"),String(n.query[e]))}),!s||(null==t?void 0:t.startsWith("http"))||(l=t?"/".concat(s).concat(t):c),l.startsWith("/".concat(s))||(null==t?void 0:t.startsWith("http"))||(l="/".concat(s).concat(l)),(0,a.jsx)(p.Z,{variant:"link",size:"sm",className:"button-link",onClick:()=>{var e;null===(e=g.Z.cache)||void 0===e||e.call(g.Z,s),n.push(l)},children:s.toUpperCase()})};var Z=t(67814);let N=()=>{let{t:e}=(0,m.$G)("common"),s=(0,h.useRouter)().query.locale||j().i18n.defaultLocale;return(0,a.jsx)(x.Z,{title:(0,a.jsxs)("span",{children:[(0,a.jsx)(Z.G,{icon:"globe",className:"me-2"}),e("common.language")]}),id:"language-selector",children:j().i18n.locales.filter(e=>e!==s).map(e=>(0,a.jsx)(x.Z.Item,{children:(0,a.jsx)(f,{locale:e})},e))})};var v=t(93419),b=t(70517);let y=()=>{let{t:e}=(0,m.$G)("common"),s=(0,b.TL)(),t=(0,b.CG)(e=>e.theme.theme);return(0,a.jsxs)("button",{className:"btn theme-toggle-btn d-flex align-items-center gap-2 ".concat(t),onClick:()=>s((0,v.X8)()),"aria-label":e("common.header.themeToggle"),children:[(0,a.jsx)(Z.G,{icon:"light"===t?"moon":"sun"}),(0,a.jsx)("span",{children:e("common.header.theme.".concat("light"===t?"dark":"light"))})]})};function w(){let{t:e}=(0,m.$G)("common");return(0,a.jsx)(n.Z,{expand:"lg",className:"shadow-sm",sticky:"top",children:(0,a.jsxs)(l.Z,{children:[(0,a.jsxs)(n.Z.Brand,{as:d.Z,href:"/",className:"d-flex align-items-center link",children:[(0,a.jsx)(o(),{src:"".concat(i.Vc,"/images/logo.png"),alt:e("common.header.logoAlt"),width:40,height:40,priority:!0,className:"rounded-circle"}),(0,a.jsx)("span",{className:"ms-2 fw-bold",style:{fontSize:"1.25rem"},children:e("common.header.title")})]}),(0,a.jsx)(n.Z.Toggle,{"aria-controls":"navbar-nav",children:(0,a.jsx)(Z.G,{icon:"bars",className:"navbar-toggler-icon"})}),(0,a.jsx)(n.Z.Collapse,{id:"navbar-nav",children:(0,a.jsxs)(c.Z,{className:"ms-auto d-flex gap-3 align-items-center",children:[(0,a.jsxs)(c.Z.Link,{as:d.Z,href:"/",children:[(0,a.jsx)(Z.G,{icon:"home",className:"me-2"}),e("common.header.menu.home")]}),(0,a.jsxs)(c.Z.Link,{as:d.Z,href:"/about",children:[(0,a.jsx)(Z.G,{icon:"info-circle",className:"me-2"}),e("common.header.menu.about")]}),(0,a.jsxs)(c.Z.Link,{as:d.Z,href:"/contact",children:[(0,a.jsx)(Z.G,{icon:"address-book",className:"me-2"}),e("common.header.menu.contact")]}),(0,a.jsx)(N,{}),(0,a.jsx)(y,{})]})})]})})}function k(){let{t:e}=(0,m.$G)("common"),s=new Date().getFullYear();return(0,a.jsx)("footer",{className:"footer py-3",children:(0,a.jsx)(l.Z,{children:(0,a.jsx)("p",{className:"text-center mb-0",children:e("common.footer.text",{year:s})})})})}function C(e){let{children:s}=e;return(0,a.jsxs)(a.Fragment,{children:[(0,a.jsx)(w,{}),(0,a.jsx)("main",{children:(0,a.jsx)(l.Z,{className:"py-5",children:s})}),(0,a.jsx)(k,{})]})}t(67294)},27749:(e,s,t)=>{t.d(s,{Z:()=>r});var a=t(85893);t(67294);var n=t(41664),l=t.n(n),c=t(11163);let r=e=>{var s;let{children:t,skipLocaleHandling:n=!1,href:r,locale:o,className:i,onClick:m,...d}=e,h=(0,c.useRouter)(),x=null!==(s=null!=o?o:h.query.locale)&&void 0!==s?s:"",u=null!=r?r:h.asPath;u.startsWith("http")&&(n=!0),x&&!n&&(u=u?"/".concat(x).concat(u):h.pathname.replace("[locale]",x));let j="link",p=i?"".concat(j," ").concat(i):j;return(0,a.jsx)(l(),{href:u,...d,legacyBehavior:!0,children:(0,a.jsx)("a",{className:p,onClick:e=>{m&&m(e)},onKeyDown:e=>{("Enter"===e.key||" "===e.key)&&(e.preventDefault(),null==m||m(e))},children:t})})}},92285:(e,s,t)=>{t.d(s,{Z:()=>c});var a=t(85893),n=t(25675),l=t.n(n);function c(e){let{src:s,alt:t,width:n=800,height:c=600,className:r="",priority:o=!0}=e;return(0,a.jsx)("div",{className:"text-center mb-4 ".concat(r),children:(0,a.jsx)(l(),{src:s,alt:t,className:"img-fluid rounded",width:n,height:c,style:{width:"100%",height:"auto"},priority:o})})}},74702:(e,s,t)=>{t.d(s,{Z:()=>k});var a=t(85893),n=t(67294),l=t(97375),c=t(85742),r=t(41874),o=t(67814),i=t(48352);function m(e){let{query:s,onChange:t}=e,{t:n}=(0,i.$G)("common");return(0,a.jsxs)("div",{className:"mb-4 search-bar",children:[(0,a.jsx)("input",{type:"text",className:"search-input",placeholder:n("common.searchBar.placeholder"),value:s,onChange:e=>{t(e.target.value)}}),(0,a.jsx)("div",{className:"search-icon",children:(0,a.jsx)(o.G,{icon:"search"})})]})}var d=t(19101),h=t(68070),x=t(23933);let u=e=>{let{currentPage:s,totalPages:t,maxPagesToShow:n=5,onPageChange:l,className:c=""}=e,r=[],o=Math.max(1,Math.min(s-Math.floor(n/2),t-n+1)),i=Math.min(t,o+n-1);r.push((0,a.jsx)(x.Z.First,{disabled:1===s,onClick:()=>l(1)},"first"),(0,a.jsx)(x.Z.Prev,{disabled:1===s,onClick:()=>l(s-1)},"prev")),o>1&&(r.push((0,a.jsx)(x.Z.Item,{onClick:()=>l(1),children:"1"},1)),o>2&&r.push((0,a.jsx)(x.Z.Ellipsis,{disabled:!0},"start-ellipsis")));for(let e=o;e<=i;e++)r.push((0,a.jsx)(x.Z.Item,{active:e===s,onClick:()=>l(e),children:e},e));return i<t&&(i<t-1&&r.push((0,a.jsx)(x.Z.Ellipsis,{disabled:!0},"end-ellipsis")),r.push((0,a.jsx)(x.Z.Item,{onClick:()=>l(t),children:t},t))),r.push((0,a.jsx)(x.Z.Next,{disabled:s===t,onClick:()=>l(s+1)},"next"),(0,a.jsx)(x.Z.Last,{disabled:s===t,onClick:()=>l(t)},"last")),(0,a.jsx)(x.Z,{className:c,children:r})};var j=t(21351);let p=e=>{let{size:s=5,pageSizeOptions:t=[5,10,20],onSizeChange:n,className:l=""}=e;return(0,a.jsxs)("fieldset",{className:"d-flex align-items-center ".concat(l),children:[(0,a.jsx)("legend",{className:"visually-hidden",children:"Page size selector"}),(0,a.jsx)(j.Z.Label,{htmlFor:"postsPerPageSelect",className:"me-2 mb-0",children:"Page size:"}),(0,a.jsx)(j.Z.Select,{id:"postsPerPageSelect",className:"mb-0",value:s,onChange:e=>n(Number(e.target.value)),style:{width:"100px"},children:t.map(e=>(0,a.jsx)("option",{value:e,children:e},e))})]})};function g(e){let{currentPage:s,totalPages:t,totalResults:n,size:c,pageSizeOptions:r=[5,10,20],maxPagesToShow:o=5,onPageChange:m,onSizeChange:x}=e,{t:j}=(0,i.$G)("common"),g=Math.min(s*c,n);return(0,a.jsx)(l.Z,{className:"pagination-bar",children:(0,a.jsxs)(d.Z,{className:"align-items-center justify-content-between flex-wrap gy-3",children:[(0,a.jsx)(h.Z,{xs:12,md:"auto",className:"d-flex justify-content-center flex-wrap",children:(0,a.jsx)(u,{className:"pagination mb-0",currentPage:s,totalPages:t,onPageChange:m,maxPagesToShow:o})}),(0,a.jsx)(h.Z,{xs:12,md:!0,className:"d-flex align-items-center justify-content-center justify-content-md-start",children:(0,a.jsx)("p",{className:"text-muted mb-0 text-nowrap",children:j("common.pagination.showingResults",{start:(s-1)*c+1,end:g,total:n})})}),(0,a.jsx)(h.Z,{xs:12,md:"auto",className:"d-flex align-items-center justify-content-center justify-content-md-end",children:(0,a.jsx)(p,{size:c,pageSizeOptions:r,onSizeChange:x})})]})})}var f=t(27749),Z=t(53280),N=t(76720),v=t(97143),b=t(70270),y=t(92285);function w(e){let{post:s}=e,{id:t,title:n,date:l,summary:c,thumbnail:r,topics:o}=s,{t:m}=(0,i.$G)("post");return(0,a.jsx)("div",{className:"post-card d-flex align-items-center mb-4",children:(0,a.jsxs)("div",{className:"post-card-content flex-grow-1",children:[(0,a.jsx)("h2",{className:"fw-bold mb-4",children:(0,a.jsx)(f.Z,{href:"/posts/".concat(t),className:"link",children:n})}),(0,a.jsx)("p",{className:"text-muted",children:(0,a.jsx)(f.Z,{href:"/posts/".concat(t),children:(0,a.jsx)(v.Z,{date:l})})}),o&&o.length>0&&(0,a.jsx)("div",{className:"mb-4",children:o.map(e=>(0,a.jsx)(f.Z,{href:"/topics/".concat(e.id),children:(0,a.jsx)(Z.Z,{bg:e.color,className:"me-2 badge-".concat(e.color),children:e.name})},e.id))}),r&&(0,a.jsx)(f.Z,{href:"/posts/".concat(t),children:(0,a.jsx)(y.Z,{className:"thumbnail-wrapper",src:"".concat(b.Vc).concat(r),alt:n,width:800,height:600})}),(0,a.jsx)("p",{className:"mb-4",children:c}),(0,a.jsx)("div",{className:"mb-4",children:(0,a.jsx)(f.Z,{href:"/posts/".concat(t),children:(0,a.jsx)(N.Z,{className:"primary",children:m("post.readMore")})})})]})})}function k(e){let{posts:s,noPostsFoundMessage:t}=e,{t:o}=(0,i.$G)(["post","common"]),[d,h]=(0,n.useState)(5),[x,u]=(0,n.useState)(1),[j,p]=(0,n.useState)(""),[f,Z]=(0,n.useState)("desc"),N=e=>{Z(e),u(1)},v=[...s.filter(e=>e.title.toLowerCase().includes(j.toLowerCase())||e.summary.toLowerCase().includes(j.toLowerCase()))].sort((e,s)=>"asc"===f?new Date(e.date).getTime()-new Date(s.date).getTime():new Date(s.date).getTime()-new Date(e.date).getTime()),b=Math.ceil(v.length/d),y=v.slice((x-1)*d,x*d),k=v.length;return(0,a.jsxs)(l.Z,{className:"mt-5",style:{maxWidth:"800px"},children:[(0,a.jsx)(m,{query:j,onChange:e=>{p(e),u(1)}}),(0,a.jsx)("div",{className:"d-flex justify-content-start mb-4",children:(0,a.jsxs)(c.Z,{id:"sort-dropdown",title:o("asc"===f?"common:common.sort.oldest":"common:common.sort.newest"),onSelect:e=>{e&&N(e)},children:[(0,a.jsx)(r.Z.Item,{eventKey:"desc",children:o("common:common.sort.newest")}),(0,a.jsx)(r.Z.Item,{eventKey:"asc",children:o("common:common.sort.oldest")})]})}),y.length>0?y.map(e=>(0,a.jsx)(w,{post:e},e.id)):(0,a.jsx)("p",{className:"text-center text-muted",children:null!=t?t:o("post.noPostsFound")}),v.length>0&&(0,a.jsx)(g,{currentPage:x,totalPages:b,size:d,onPageChange:e=>u(e),onSizeChange:e=>{h(e),u(1)},totalResults:k})]})}},47191:(e,s,t)=>{t.d(s,{Z:()=>c});var a=t(11255),n=t(34421),l=t.n(n);let c=(0,a.Z)({fallbackLng:l().i18n.defaultLocale,supportedLngs:l().i18n.locales})}}]);