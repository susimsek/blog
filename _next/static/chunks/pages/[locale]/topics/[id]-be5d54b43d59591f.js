(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[356],{42255:(e,t,s)=>{(window.__NEXT_P=window.__NEXT_P||[]).push(["/[locale]/topics/[id]",function(){return s(97593)}])},97143:(e,t,s)=>{"use strict";s.d(t,{Z:()=>i});var a=s(85893);s(67294);var n=s(11163),c=s(34421),l=s.n(c);function i(e){var t;let{date:s,locale:c}=e,i=(0,n.useRouter)(),o=null!==(t=null!=c?c:i.query.locale)&&void 0!==t?t:l().i18n.defaultLocale;return(0,a.jsx)("span",{children:new Date(s).toLocaleDateString(o,{year:"numeric",month:"long",day:"numeric"})})}},92285:(e,t,s)=>{"use strict";s.d(t,{Z:()=>l});var a=s(85893),n=s(25675),c=s.n(n);function l(e){let{src:t,alt:s,width:n=800,height:l=600,className:i="",priority:o=!0}=e;return(0,a.jsx)("div",{className:"text-center mb-4 ".concat(i),children:(0,a.jsx)(c(),{src:t,alt:s,className:"img-fluid rounded",width:n,height:l,style:{width:"100%",height:"auto"},priority:o})})}},74702:(e,t,s)=>{"use strict";s.d(t,{Z:()=>C});var a=s(85893),n=s(67294),c=s(97375),l=s(85742),i=s(41874),o=s(67814),r=s(48352);function d(e){let{query:t,onChange:s}=e,{t:n}=(0,r.$G)("common");return(0,a.jsxs)("div",{className:"mb-4 search-bar",children:[(0,a.jsx)("input",{type:"text",className:"search-input",placeholder:n("common.searchBar.placeholder"),value:t,onChange:e=>{s(e.target.value)}}),(0,a.jsx)("div",{className:"search-icon",children:(0,a.jsx)(o.G,{icon:"search"})})]})}var m=s(19101),h=s(68070),x=s(23933);let u=e=>{let{currentPage:t,totalPages:s,maxPagesToShow:n=5,onPageChange:c,className:l=""}=e,i=[],o=Math.max(1,Math.min(t-Math.floor(n/2),s-n+1)),r=Math.min(s,o+n-1);i.push((0,a.jsx)(x.Z.First,{disabled:1===t,onClick:()=>c(1)},"first"),(0,a.jsx)(x.Z.Prev,{disabled:1===t,onClick:()=>c(t-1)},"prev")),o>1&&(i.push((0,a.jsx)(x.Z.Item,{onClick:()=>c(1),children:"1"},1)),o>2&&i.push((0,a.jsx)(x.Z.Ellipsis,{disabled:!0},"start-ellipsis")));for(let e=o;e<=r;e++)i.push((0,a.jsx)(x.Z.Item,{active:e===t,onClick:()=>c(e),children:e},e));return r<s&&(r<s-1&&i.push((0,a.jsx)(x.Z.Ellipsis,{disabled:!0},"end-ellipsis")),i.push((0,a.jsx)(x.Z.Item,{onClick:()=>c(s),children:s},s))),i.push((0,a.jsx)(x.Z.Next,{disabled:t===s,onClick:()=>c(t+1)},"next"),(0,a.jsx)(x.Z.Last,{disabled:t===s,onClick:()=>c(s)},"last")),(0,a.jsx)(x.Z,{className:l,children:i})};var p=s(21351);let j=e=>{let{size:t=5,pageSizeOptions:s=[5,10,20],onSizeChange:n,className:c=""}=e;return(0,a.jsxs)("fieldset",{className:"d-flex align-items-center ".concat(c),children:[(0,a.jsx)("legend",{className:"visually-hidden",children:"Page size selector"}),(0,a.jsx)(p.Z.Label,{htmlFor:"postsPerPageSelect",className:"me-2 mb-0",children:"Page size:"}),(0,a.jsx)(p.Z.Select,{id:"postsPerPageSelect",className:"mb-0",value:t,onChange:e=>n(Number(e.target.value)),style:{width:"100px"},children:s.map(e=>(0,a.jsx)("option",{value:e,children:e},e))})]})};function g(e){let{currentPage:t,totalPages:s,totalResults:n,size:l,pageSizeOptions:i=[5,10,20],maxPagesToShow:o=5,onPageChange:d,onSizeChange:x}=e,{t:p}=(0,r.$G)("common"),g=Math.min(t*l,n);return(0,a.jsx)(c.Z,{className:"pagination-bar",children:(0,a.jsxs)(m.Z,{className:"align-items-center justify-content-between flex-wrap gy-3",children:[(0,a.jsx)(h.Z,{xs:12,md:"auto",className:"d-flex justify-content-center flex-wrap",children:(0,a.jsx)(u,{className:"pagination mb-0",currentPage:t,totalPages:s,onPageChange:d,maxPagesToShow:o})}),(0,a.jsx)(h.Z,{xs:12,md:!0,className:"d-flex align-items-center justify-content-center justify-content-md-start",children:(0,a.jsx)("p",{className:"text-muted mb-0 text-nowrap",children:p("common.pagination.showingResults",{start:(t-1)*l+1,end:g,total:n})})}),(0,a.jsx)(h.Z,{xs:12,md:"auto",className:"d-flex align-items-center justify-content-center justify-content-md-end",children:(0,a.jsx)(j,{size:l,pageSizeOptions:i,onSizeChange:x})})]})})}var f=s(27749),N=s(53280),Z=s(76720),w=s(97143),b=s(70270),v=s(92285);function y(e){let{post:t}=e,{id:s,title:n,date:c,summary:l,thumbnail:i,topics:o}=t,{t:d}=(0,r.$G)("post");return(0,a.jsx)("div",{className:"post-card d-flex align-items-center mb-4",children:(0,a.jsxs)("div",{className:"post-card-content flex-grow-1",children:[(0,a.jsx)("h2",{className:"fw-bold mb-4",children:(0,a.jsx)(f.Z,{href:"/posts/".concat(s),className:"link",children:n})}),(0,a.jsx)("p",{className:"text-muted",children:(0,a.jsx)(f.Z,{href:"/posts/".concat(s),children:(0,a.jsx)(w.Z,{date:c})})}),o&&o.length>0&&(0,a.jsx)("div",{className:"mb-4",children:o.map(e=>(0,a.jsx)(f.Z,{href:"/topics/".concat(e.id),children:(0,a.jsx)(N.Z,{bg:e.color,className:"me-2 badge-".concat(e.color),children:e.name})},e.id))}),i&&(0,a.jsx)(f.Z,{href:"/posts/".concat(s),children:(0,a.jsx)(v.Z,{className:"thumbnail-wrapper",src:"".concat(b.Vc).concat(i),alt:n,width:800,height:600})}),(0,a.jsx)("p",{className:"mb-4",children:l}),(0,a.jsx)("div",{className:"mb-4",children:(0,a.jsx)(f.Z,{href:"/posts/".concat(s),children:(0,a.jsx)(Z.Z,{className:"primary",children:d("post.readMore")})})})]})})}function C(e){let{posts:t,noPostsFoundMessage:s}=e,{t:o}=(0,r.$G)(["post","common"]),[m,h]=(0,n.useState)(5),[x,u]=(0,n.useState)(1),[p,j]=(0,n.useState)(""),[f,N]=(0,n.useState)("desc"),Z=e=>{N(e),u(1)},w=[...t.filter(e=>e.title.toLowerCase().includes(p.toLowerCase())||e.summary.toLowerCase().includes(p.toLowerCase()))].sort((e,t)=>"asc"===f?new Date(e.date).getTime()-new Date(t.date).getTime():new Date(t.date).getTime()-new Date(e.date).getTime()),b=Math.ceil(w.length/m),v=w.slice((x-1)*m,x*m),C=w.length;return(0,a.jsxs)(c.Z,{className:"mt-5",style:{maxWidth:"800px"},children:[(0,a.jsx)(d,{query:p,onChange:e=>{j(e),u(1)}}),(0,a.jsx)("div",{className:"d-flex justify-content-start mb-4",children:(0,a.jsxs)(l.Z,{id:"sort-dropdown",title:o("asc"===f?"common:common.sort.oldest":"common:common.sort.newest"),onSelect:e=>{e&&Z(e)},children:[(0,a.jsx)(i.Z.Item,{eventKey:"desc",children:o("common:common.sort.newest")}),(0,a.jsx)(i.Z.Item,{eventKey:"asc",children:o("common:common.sort.oldest")})]})}),v.length>0?v.map(e=>(0,a.jsx)(y,{post:e},e.id)):(0,a.jsx)("p",{className:"text-center text-muted",children:null!=s?s:o("post.noPostsFound")}),w.length>0&&(0,a.jsx)(g,{currentPage:x,totalPages:b,size:m,onPageChange:e=>u(e),onSizeChange:e=>{h(e),u(1)},totalResults:C})]})}},97593:(e,t,s)=>{"use strict";s.r(t),s.d(t,{__N_SSG:()=>d,default:()=>m});var a=s(85893);s(67294);var n=s(9008),c=s.n(n),l=s(74702),i=s(92098),o=s(70270),r=s(48352),d=!0;function m(e){let{topic:t,posts:s}=e,{t:n}=(0,r.$G)(["topic"]);return(0,a.jsxs)(i.Z,{children:[(0,a.jsxs)(c(),{children:[(0,a.jsx)("title",{children:n("topic.title",{topic:t.name})}),(0,a.jsx)("meta",{name:"description",content:n("topic.meta.description",{topic:t.name})}),(0,a.jsx)("meta",{name:"keywords",content:n("topic.meta.keywords",{topic:t.name})}),(0,a.jsx)("meta",{name:"author",content:o.x1})]}),(0,a.jsxs)("div",{children:[(0,a.jsxs)("header",{className:"text-center py-4",children:[(0,a.jsx)("h1",{className:"fw-bold mb-4",children:n("topic.title",{topic:t.name})}),(0,a.jsx)("p",{className:"text-muted fs-4",children:n("topic.subtitle",{topic:t.name})})]}),(0,a.jsx)(l.Z,{posts:s,noPostsFoundMessage:n("topic.no_posts",{topic:t.name})})]})]})}}},e=>{var t=t=>e(e.s=t);e.O(0,[557,808,606,98,888,774,179],()=>t(42255)),_N_E=e.O()}]);