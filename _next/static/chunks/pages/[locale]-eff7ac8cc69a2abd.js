(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[513],{3124:(e,s,a)=>{(window.__NEXT_P=window.__NEXT_P||[]).push(["/[locale]",function(){return a(3169)}])},4421:e=>{"use strict";e.exports={debug:!1,i18n:{defaultLocale:"en",locales:["en","tr"]},localePath:"/locales",reloadOnPrerender:!1}},8688:(e,s,a)=>{"use strict";a.d(s,{Z:()=>C});var t=a(5893),n=a(3814),l=a(7375),c=a(4593),r=a(9580),o=a(5675),i=a.n(o),h=a(270),d=a(5007),m=a(3391),x=a(7814),u=a(3205),j=a(4622),p=a(1163),g=a(4421),f=a.n(g),Z=a(7191),N=a(1664),b=a.n(N),v=a(6720);a(7294);let k=e=>{let{locale:s,href:a,...n}=e,l=(0,p.useRouter)(),c=a||l.asPath,r=l.pathname;return Object.keys(l.query).forEach(e=>{if("locale"===e){r=r.replace("[".concat(e,"]"),s);return}r=r.replace("[".concat(e,"]"),String(l.query[e]))}),s&&(c=a?"/".concat(s).concat(a):r),c.startsWith("/".concat(s))||(c="/".concat(s).concat(c)),(0,t.jsx)(b(),{href:c,passHref:!0,legacyBehavior:!0,children:(0,t.jsx)(v.Z,{...n,variant:"link",size:"sm",className:"button-link",onClick:()=>{var e;return null===(e=Z.Z.cache)||void 0===e?void 0:e.call(Z.Z,s)},children:s.toUpperCase()})})};function w(){let{t:e}=(0,j.$G)("common"),s=(0,p.useRouter)(),a=(0,d.I0)(),o=(0,d.v9)(e=>e.theme.theme),g=s.query.locale||f().i18n.defaultLocale;return(0,t.jsx)(n.Z,{expand:"lg",className:"shadow-sm",children:(0,t.jsxs)(l.Z,{children:[(0,t.jsxs)(n.Z.Brand,{as:u.Z,href:"/",className:"d-flex align-items-center link",children:[(0,t.jsx)(i(),{src:"".concat(h.Vc,"/images/logo.png"),alt:e("common.header.logoAlt"),width:40,height:40,priority:!0,className:"rounded-circle"}),(0,t.jsx)("span",{className:"ms-2 fw-bold",style:{fontSize:"1.25rem"},children:e("common.header.title")})]}),(0,t.jsx)(n.Z.Toggle,{"aria-controls":"navbar-nav",children:(0,t.jsx)(x.G,{icon:"bars",className:"navbar-toggler-icon"})}),(0,t.jsx)(n.Z.Collapse,{id:"navbar-nav",children:(0,t.jsxs)(c.Z,{className:"ms-auto d-flex gap-3 align-items-center",children:[(0,t.jsx)(c.Z.Link,{as:u.Z,href:"/",children:e("common.header.menu.home")}),(0,t.jsx)(c.Z.Link,{as:u.Z,href:"/about",children:e("common.header.menu.about")}),(0,t.jsx)(c.Z.Link,{as:u.Z,href:"/contact",children:e("common.header.menu.contact")}),(0,t.jsx)(r.Z,{title:(0,t.jsxs)("span",{children:[(0,t.jsx)(x.G,{icon:"globe",className:"me-2"}),e("common.language")]}),id:"language-selector",children:f().i18n.locales.filter(e=>e!==g).map(e=>(0,t.jsx)(r.Z.Item,{children:(0,t.jsx)(k,{locale:e})},e))}),(0,t.jsxs)("button",{className:"btn theme-toggle-btn d-flex align-items-center gap-2 ".concat(o),onClick:()=>a((0,m.X8)()),"aria-label":e("common.header.themeToggle"),children:[(0,t.jsx)(x.G,{icon:"light"===o?"moon":"sun"}),(0,t.jsx)("span",{children:e("common.header.theme.".concat(o))})]})]})})]})})}function y(){let{t:e}=(0,j.$G)("common"),s=new Date().getFullYear();return(0,t.jsx)("footer",{className:"footer py-3",children:(0,t.jsx)(l.Z,{children:(0,t.jsx)("p",{className:"text-center mb-0",children:e("common.footer.text",{year:s})})})})}function C(e){let{children:s}=e;return(0,t.jsxs)(t.Fragment,{children:[(0,t.jsx)(w,{}),(0,t.jsx)("main",{children:(0,t.jsx)(l.Z,{className:"py-5",children:s})}),(0,t.jsx)(y,{})]})}},3205:(e,s,a)=>{"use strict";a.d(s,{Z:()=>r});var t=a(5893);a(7294);var n=a(1664),l=a.n(n),c=a(1163);let r=e=>{let{children:s,skipLocaleHandling:a=!1,href:n,locale:r,className:o,onClick:i,...h}=e,d=(0,c.useRouter)(),m=r||d.query.locale||"",x=n||d.asPath;x.startsWith("http")&&(a=!0),m&&!a&&(x=x?"/".concat(m).concat(x):d.pathname.replace("[locale]",m));let u="link",j=o?"".concat(u," ").concat(o):u;return(0,t.jsx)(l(),{href:x,...h,legacyBehavior:!0,children:(0,t.jsx)("a",{className:j,onClick:e=>{i&&i(e)},children:s})})}},7191:(e,s,a)=>{"use strict";a.d(s,{Z:()=>c});var t=a(1255),n=a(4421),l=a.n(n);let c=(0,t.Z)({fallbackLng:l().i18n.defaultLocale,supportedLngs:l().i18n.locales})},3169:(e,s,a)=>{"use strict";a.r(s),a.d(s,{__N_SSG:()=>y,default:()=>C});var t=a(5893),n=a(7294),l=a(7375),c=a(7814),r=a(4622);function o(e){let{query:s,onChange:a}=e,{t:n}=(0,r.$G)("common");return(0,t.jsxs)("div",{className:"mb-4 search-bar",children:[(0,t.jsx)("input",{type:"text",className:"search-input",placeholder:n("common.searchBar.placeholder"),value:s,onChange:e=>{a(e.target.value)}}),(0,t.jsx)("div",{className:"search-icon",children:(0,t.jsx)(c.G,{icon:"search"})})]})}var i=a(9101),h=a(8070),d=a(7137),m=a(3933);let x=e=>{let{currentPage:s,totalPages:a,maxPagesToShow:n=5,onPageChange:l}=e,c=[],r=Math.max(1,Math.min(s-Math.floor(n/2),a-n+1)),o=Math.min(a,r+n-1);c.push((0,t.jsx)(m.Z.First,{disabled:1===s,onClick:()=>l(1)},"first"),(0,t.jsx)(m.Z.Prev,{disabled:1===s,onClick:()=>l(s-1)},"prev")),r>1&&(c.push((0,t.jsx)(m.Z.Item,{onClick:()=>l(1),children:"1"},1)),r>2&&c.push((0,t.jsx)(m.Z.Ellipsis,{disabled:!0},"start-ellipsis")));for(let e=r;e<=o;e++)c.push((0,t.jsx)(m.Z.Item,{active:e===s,onClick:()=>l(e),children:e},e));return o<a&&(o<a-1&&c.push((0,t.jsx)(m.Z.Ellipsis,{disabled:!0},"end-ellipsis")),c.push((0,t.jsx)(m.Z.Item,{onClick:()=>l(a),children:a},a))),c.push((0,t.jsx)(m.Z.Next,{disabled:s===a,onClick:()=>l(s+1)},"next"),(0,t.jsx)(m.Z.Last,{disabled:s===a,onClick:()=>l(a)},"last")),(0,t.jsx)(m.Z,{children:c})};function u(e){let{currentPage:s,totalPages:a,maxPagesToShow:n=5,size:l,onPageChange:c,onSizeChange:o}=e,{t:m}=(0,r.$G)("common");return(0,t.jsxs)(i.Z,{className:"align-items-center mt-4",children:[(0,t.jsx)(h.Z,{children:(0,t.jsx)(x,{currentPage:s,totalPages:a,onPageChange:c,maxPagesToShow:n})}),(0,t.jsx)(h.Z,{md:"auto",children:(0,t.jsxs)(d.Z.Group,{controlId:"postsPerPageSelect",className:"d-flex align-items-center",children:[(0,t.jsxs)(d.Z.Label,{className:"me-2 mb-0",children:[m("common.pagination.pageSize"),":"]}),(0,t.jsxs)(d.Z.Select,{value:l,onChange:e=>o(Number(e.target.value)),style:{width:"100px"},children:[(0,t.jsx)("option",{value:5,children:"5"}),(0,t.jsx)("option",{value:10,children:"10"}),(0,t.jsx)("option",{value:20,children:"20"})]})]})})]})}var j=a(3205),p=a(5675),g=a.n(p),f=a(3280);function Z(e){let{post:s}=e,{id:a,title:n,date:l,summary:c,thumbnail:r,topics:o}=s;return(0,t.jsxs)("div",{className:"post-card d-flex align-items-center mb-4",children:[(0,t.jsxs)("div",{className:"post-card-content flex-grow-1",children:[(0,t.jsx)("h2",{className:"fw-bold mb-2",children:(0,t.jsx)(j.Z,{href:"/posts/".concat(a),className:"link",children:n})}),(0,t.jsx)("p",{className:"text-muted mb-2",children:c}),(0,t.jsx)("p",{className:"text-muted",children:new Date(l).toLocaleDateString(void 0,{year:"numeric",month:"long",day:"numeric"})}),o&&o.length>0&&(0,t.jsx)("div",{className:"mt-2",children:o.map(e=>(0,t.jsx)(f.Z,{bg:"secondary",className:"me-2",children:e},e))})]}),r&&(0,t.jsx)("div",{className:"post-card-thumbnail-wrapper ms-3",children:(0,t.jsx)(g(),{src:"".concat("/blog/").concat(r),alt:n,className:"rounded",width:120,height:80,style:{objectFit:"cover"}})})]})}function N(e){let{posts:s}=e,{t:a}=(0,r.$G)("post"),[c,i]=(0,n.useState)(5),[h,d]=(0,n.useState)(1),[m,x]=(0,n.useState)(""),j=s.filter(e=>e.title.toLowerCase().includes(m.toLowerCase())||e.summary.toLowerCase().includes(m.toLowerCase())),p=Math.ceil(j.length/c),g=j.slice((h-1)*c,h*c);return(0,t.jsxs)(l.Z,{className:"mt-5",style:{maxWidth:"700px"},children:[(0,t.jsx)(o,{query:m,onChange:e=>{x(e),d(1)}}),g.length>0?g.map(e=>(0,t.jsx)(Z,{post:e},e.id)):(0,t.jsx)("p",{className:"text-center text-muted",children:a("post.noPostsFound")}),j.length>0&&(0,t.jsx)(u,{currentPage:h,totalPages:p,size:c,onPageChange:e=>d(e),onSizeChange:e=>{i(e),d(1)}})]})}var b=a(9008),v=a.n(b),k=a(270),w=a(8688),y=!0;function C(e){let{allPostsData:s}=e,{t:a}=(0,r.$G)("home");return(0,t.jsxs)(w.Z,{children:[(0,t.jsxs)(v(),{children:[(0,t.jsx)("title",{children:a("home.title")}),(0,t.jsx)("meta",{name:"description",content:a("home.meta.description")}),(0,t.jsx)("meta",{name:"keywords",content:a("home.meta.keywords")}),(0,t.jsx)("meta",{name:"author",content:k.x1})]}),(0,t.jsxs)("div",{children:[(0,t.jsxs)("header",{className:"text-center py-5",children:[(0,t.jsx)("h1",{className:"fw-bold mb-4",children:a("home.header.title")}),(0,t.jsx)("p",{className:"text-muted fs-5",children:a("home.header.subtitle")})]}),(0,t.jsx)(N,{posts:s})]})]})}}},e=>{var s=s=>e(e.s=s);e.O(0,[307,180,888,774,179],()=>s(3124)),_N_E=e.O()}]);