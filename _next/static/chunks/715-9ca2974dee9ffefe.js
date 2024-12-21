"use strict";(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[715],{97143:(e,s,t)=>{t.d(s,{Z:()=>i});var a=t(85893);t(67294);var l=t(11163),c=t(34421),n=t.n(c);function i(e){var s;let{date:t,locale:c}=e,i=(0,l.useRouter)(),r=null!==(s=null!=c?c:i.query.locale)&&void 0!==s?s:n().i18n.defaultLocale;return(0,a.jsx)("span",{children:new Date(t).toLocaleDateString(r,{year:"numeric",month:"long",day:"numeric"})})}},92285:(e,s,t)=>{t.d(s,{Z:()=>n});var a=t(85893),l=t(25675),c=t.n(l);function n(e){let{src:s,alt:t,width:l=800,height:n=600,className:i="",priority:r=!0}=e;return(0,a.jsx)("div",{className:"text-center mb-4 ".concat(i),children:(0,a.jsx)(c(),{src:s,alt:t,className:"img-fluid rounded",width:l,height:n,style:{width:"100%",height:"auto"},priority:r})})}},88715:(e,s,t)=>{t.d(s,{Z:()=>P});var a=t(85893),l=t(67294),c=t(97375),n=t(67814),i=t(48352);function r(e){let{query:s,onChange:t,className:l}=e,{t:c}=(0,i.$G)("common");return(0,a.jsxs)("div",{className:"search-bar d-flex align-items-center ".concat(null!=l?l:""),children:[(0,a.jsx)("input",{type:"text",className:"search-input form-control me-2",placeholder:c("common.searchBar.placeholder"),value:s,onChange:e=>{t(e.target.value)}}),(0,a.jsx)("div",{className:"search-icon",children:(0,a.jsx)(n.G,{icon:"search"})})]})}var o=t(19101),d=t(68070),m=t(23933);let h=e=>{let{currentPage:s,totalPages:t,maxPagesToShow:l=5,onPageChange:c,className:n=""}=e,i=[],r=Math.max(1,Math.min(s-Math.floor(l/2),t-l+1)),o=Math.min(t,r+l-1);i.push((0,a.jsx)(m.Z.First,{disabled:1===s,onClick:()=>c(1)},"first"),(0,a.jsx)(m.Z.Prev,{disabled:1===s,onClick:()=>c(s-1)},"prev")),r>1&&(i.push((0,a.jsx)(m.Z.Item,{onClick:()=>c(1),children:"1"},1)),r>2&&i.push((0,a.jsx)(m.Z.Ellipsis,{disabled:!0},"start-ellipsis")));for(let e=r;e<=o;e++)i.push((0,a.jsx)(m.Z.Item,{active:e===s,onClick:()=>c(e),children:e},e));return o<t&&(o<t-1&&i.push((0,a.jsx)(m.Z.Ellipsis,{disabled:!0},"end-ellipsis")),i.push((0,a.jsx)(m.Z.Item,{onClick:()=>c(t),children:t},t))),i.push((0,a.jsx)(m.Z.Next,{disabled:s===t,onClick:()=>c(s+1)},"next"),(0,a.jsx)(m.Z.Last,{disabled:s===t,onClick:()=>c(t)},"last")),(0,a.jsx)(m.Z,{className:n,children:i})};var x=t(21351);let u=e=>{let{size:s=5,pageSizeOptions:t=[5,10,20],onSizeChange:l,className:c=""}=e;return(0,a.jsxs)("fieldset",{className:"d-flex align-items-center ".concat(c),children:[(0,a.jsx)("legend",{className:"visually-hidden",children:"Page size selector"}),(0,a.jsx)(x.Z.Label,{htmlFor:"postsPerPageSelect",className:"me-2 mb-0",children:"Page size:"}),(0,a.jsx)(x.Z.Select,{id:"postsPerPageSelect",className:"mb-0",value:s,onChange:e=>l(Number(e.target.value)),style:{width:"100px"},children:t.map(e=>(0,a.jsx)("option",{value:e,children:e},e))})]})};function j(e){let{currentPage:s,totalPages:t,totalResults:l,size:n,pageSizeOptions:r=[5,10,20],maxPagesToShow:m=5,onPageChange:x,onSizeChange:j}=e,{t:p}=(0,i.$G)("common"),g=Math.min(s*n,l);return(0,a.jsx)(c.Z,{className:"pagination-bar",children:(0,a.jsxs)(o.Z,{className:"align-items-center justify-content-between flex-wrap gy-3",children:[(0,a.jsx)(d.Z,{xs:12,md:"auto",className:"d-flex justify-content-center flex-wrap",children:(0,a.jsx)(h,{className:"pagination mb-0",currentPage:s,totalPages:t,onPageChange:x,maxPagesToShow:m})}),(0,a.jsx)(d.Z,{xs:12,md:!0,className:"d-flex align-items-center justify-content-center justify-content-md-start",children:(0,a.jsx)("p",{className:"text-muted mb-0 text-nowrap",children:p("common.pagination.showingResults",{start:(s-1)*n+1,end:g,total:l})})}),(0,a.jsx)(d.Z,{xs:12,md:"auto",className:"d-flex align-items-center justify-content-center justify-content-md-end",children:(0,a.jsx)(u,{size:n,pageSizeOptions:r,onSizeChange:j})})]})})}var p=t(27749),g=t(53280),f=t(76720),N=t(97143),v=t(70270),Z=t(92285);function w(e){let{post:s}=e,{id:t,title:l,date:c,summary:n,thumbnail:r,topics:o}=s,{t:d}=(0,i.$G)("post");return(0,a.jsx)("div",{className:"post-card d-flex align-items-center mb-4",children:(0,a.jsxs)("div",{className:"post-card-content flex-grow-1",children:[(0,a.jsx)("h2",{className:"fw-bold mb-4",children:(0,a.jsx)(p.Z,{href:"/posts/".concat(t),className:"link",children:l})}),(0,a.jsx)("p",{className:"text-muted",children:(0,a.jsx)(p.Z,{href:"/posts/".concat(t),children:(0,a.jsx)(N.Z,{date:c})})}),o&&o.length>0&&(0,a.jsx)("div",{className:"mb-4",children:o.map(e=>(0,a.jsx)(p.Z,{href:"/topics/".concat(e.id),children:(0,a.jsx)(g.Z,{bg:e.color,className:"me-2 badge-".concat(e.color),children:e.name})},e.id))}),r&&(0,a.jsx)(p.Z,{href:"/posts/".concat(t),children:(0,a.jsx)(Z.Z,{className:"thumbnail-wrapper",src:"".concat(v.Vc).concat(r),alt:l,width:800,height:600})}),(0,a.jsx)("p",{className:"mb-4",children:n}),(0,a.jsx)("div",{className:"mb-4",children:(0,a.jsx)(p.Z,{href:"/posts/".concat(t),children:(0,a.jsx)(f.Z,{className:"primary",children:d("post.readMore")})})})]})})}var b=t(85742),y=t(41874);function C(e){let{sortOrder:s,onChange:t}=e,{t:l}=(0,i.$G)("common");return(0,a.jsxs)(b.Z,{id:"sort-dropdown",variant:"primary",className:"me-2 mb-2",align:"start",flip:!1,title:l("asc"===s?"common.sort.oldest":"common.sort.newest"),onSelect:e=>e&&t(e),children:[(0,a.jsxs)(y.Z.Item,{eventKey:"desc",children:[l("common.sort.newest"),"desc"===s&&(0,a.jsx)(n.G,{icon:"circle-check",className:"ms-2 circle-check"})]}),(0,a.jsxs)(y.Z.Item,{eventKey:"asc",children:[l("common.sort.oldest"),"asc"===s&&(0,a.jsx)(n.G,{icon:"circle-check",className:"ms-2 circle-check"})]})]})}function k(e){var s,t;let{topics:c,selectedTopic:o,onTopicChange:d}=e,{t:m}=(0,i.$G)("common"),[x,u]=(0,l.useState)(""),[j,p]=(0,l.useState)(c),[f,N]=(0,l.useState)(1),v=Math.ceil(j.length/5),Z=j.slice((f-1)*5,5*f);return(0,a.jsxs)(b.Z,{id:"topics-dropdown",variant:"primary",className:"mb-2",flip:!1,align:"start",title:o&&null!==(t=null===(s=c.find(e=>e.id===o))||void 0===s?void 0:s.name)&&void 0!==t?t:m("common.allTopics"),children:[(0,a.jsx)("div",{className:"p-2",children:(0,a.jsx)(r,{query:x,onChange:e=>{u(e),p(c.filter(s=>s.name.toLowerCase().includes(e.toLowerCase()))),N(1)},className:"w-100"})}),(0,a.jsx)(y.Z.Divider,{}),(0,a.jsxs)(y.Z.Item,{onClick:()=>d(null),className:"d-flex align-items-center",children:[(0,a.jsx)(g.Z,{bg:"gray",className:"badge-gray me-2",children:m("common.allTopics")}),!o&&(0,a.jsx)(n.G,{icon:"circle-check",className:"ms-auto"})]}),Z.map(e=>(0,a.jsxs)(y.Z.Item,{onClick:()=>d(e.id),className:"d-flex align-items-center",children:[(0,a.jsx)(g.Z,{bg:e.color,className:"badge-".concat(e.color," me-2"),children:e.name}),o===e.id&&(0,a.jsx)(n.G,{icon:"circle-check",className:"ms-auto"})]},e.id)),(0,a.jsx)(y.Z.Divider,{}),(0,a.jsx)("div",{className:"d-flex justify-content-center p-2",children:(0,a.jsx)(h,{currentPage:f,totalPages:v,maxPagesToShow:5,onPageChange:e=>{N(e)}})})]})}function P(e){let{posts:s,topics:t=[],noPostsFoundMessage:n}=e,{t:o}=(0,i.$G)(["post","common"]),[d,m]=(0,l.useState)(5),[h,x]=(0,l.useState)(1),[u,p]=(0,l.useState)(""),[g,f]=(0,l.useState)("desc"),[N,v]=(0,l.useState)(null),Z=[...s.filter(e=>{var s;return(e.title.toLowerCase().includes(u.toLowerCase())||e.summary.toLowerCase().includes(u.toLowerCase()))&&(!N||(null===(s=e.topics)||void 0===s?void 0:s.some(e=>e.id===N)))})].sort((e,s)=>"asc"===g?new Date(e.date).getTime()-new Date(s.date).getTime():new Date(s.date).getTime()-new Date(e.date).getTime()),b=Z.slice((h-1)*d,h*d);return(0,a.jsxs)(c.Z,{className:"mt-5",style:{maxWidth:"800px"},children:[(0,a.jsxs)("div",{className:"d-flex flex-wrap align-items-center mb-3",children:[(0,a.jsx)("div",{className:"flex-grow-1 mb-4",children:(0,a.jsx)(r,{query:u,onChange:p})}),(0,a.jsxs)("div",{className:"d-flex flex-column flex-md-row align-items-stretch w-100 w-md-auto",style:{gap:"10px"},children:[t.length>0&&(0,a.jsx)(k,{topics:t,selectedTopic:N,onTopicChange:e=>{v(e),x(1)}}),(0,a.jsx)(C,{sortOrder:g,onChange:e=>{f(e),x(1)}})]})]}),b.length>0?b.map(e=>(0,a.jsx)(w,{post:e},e.id)):(0,a.jsx)("p",{className:"text-center text-muted",children:null!=n?n:o("post.noPostsFound")}),(0,a.jsx)(j,{currentPage:h,totalPages:Math.ceil(Z.length/d),size:d,onPageChange:x,onSizeChange:e=>{m(e),x(1)},totalResults:Z.length})]})}}}]);